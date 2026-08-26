import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  NgZone,
  OnDestroy,
  ViewChild,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

type ModelOption = { label: string; url: string };
type Axis = 'x' | 'y' | 'z';
type WrapMode = 'front' | 'around';

/** Una muestra de rayo: el vertice proyectado sobre la malla, o el fallo. */
type RaySample = {
  hit: boolean;
  /** Posicion local al modelRoot, ya separada de la superficie. */
  position: THREE.Vector3;
  uv: THREE.Vector2;
  /** Distancia recorrida por el rayo hasta la superficie. */
  depth: number;
};

/**
 * Campo de proyeccion: convierte parametros de rejilla (gu, gv) en [0,1]
 * en un rayo en espacio mundo y en su coordenada de textura.
 * Frontal, radial y tira de horneado solo se diferencian en esto.
 */
type ProjectionField = {
  ray(gu: number, gv: number, origin: THREE.Vector3, direction: THREE.Vector3): void;
  uv(gu: number, gv: number, out: THREE.Vector2): void;
  far: number;
  /** Separacion de la lamina respecto de la superficie. */
  lift: number;
  /** Salto de profundidad maximo dentro de una celda antes de considerarla un puente. */
  depthTolerance: number;
};

type ProjectedSurface = {
  positions: number[];
  uvs: number[];
  hasHit: boolean;
  minGu: number;
  maxGu: number;
  minGv: number;
  maxGv: number;
};

type FrontProjectionOptions = {
  sourceMinU?: number;
  sourceMaxU?: number;
  placementMinU?: number;
  placementMaxU?: number;
};

type FrontProjectionResult = {
  geometry: THREE.BufferGeometry;
  overflows: boolean;
  horizontalOverflows: boolean;
  verticalOverflows: boolean;
  centerHit: boolean;
  visibleMinU: number;
  visibleMaxU: number;
  visibleMinV: number;
  visibleMaxV: number;
};

type FrontProjectionMetrics = {
  projectionWidth: number;
  projectionHeight: number;
  center: THREE.Vector3;
  modelCenter: THREE.Vector3;
  radius: number;
};

type StickerStripOptions = {
  sourceMinU: number;
  sourceMaxU: number;
  anchorU: number;
  anchorAngle: number;
  radiansPerU: number;
};

type BakeAnchor = {
  angle: number;
  radius: number;
  point: THREE.Vector3;
};

type BvhGeometry = THREE.BufferGeometry & {
  computeBoundsTree?: () => void;
  disposeBoundsTree?: () => void;
};

@Component({
  selector: 'app-product-wrapper',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-wrapper.html',
  styleUrl: './product-wrapper.scss',
})
export class ProductWrapperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasHost', { static: true }) private canvasHost!: ElementRef<HTMLDivElement>;
  @ViewChild('previewCanvas', { static: true }) private previewCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('segThumb', { static: true }) private segThumb!: ElementRef<HTMLElement>;
  @ViewChild('statusReadout', { static: true }) private statusReadout!: ElementRef<HTMLElement>;

  private readonly warnChip = viewChild<ElementRef<HTMLElement>>('warnChip');
  private readonly renderCard = viewChild<ElementRef<HTMLElement>>('renderCard');
  private readonly renderShade = viewChild<ElementRef<HTMLElement>>('renderShade');

  readonly modelOptions: ModelOption[] = [
    { label: 'Taza', url: 'procedural-mug-studio' },
    { label: 'Balón', url: 'procedural-ball' },
    { label: 'Caja', url: 'procedural-carton' },
    { label: 'Bidón', url: 'procedural-jerrycan' },
    { label: 'Pouch', url: 'procedural-pouch' },
  ];

  /**
   * Modelos ocultos del selector pero vivos: se siguen cargando por url.
   * Los procedurales pasan por createProceduralModel, los de archivo por assets.
   */
  readonly hiddenModelOptions: ModelOption[] = [
    { label: 'Botella de prueba', url: 'procedural' },
    { label: 'Caja abierta', url: 'procedural-box' },
    { label: 'Taza (anterior)', url: 'procedural-mug' },
    { label: 'Pelota de futbol', url: 'procedural-soccer' },
    { label: '1', url: '/assets/models/1.stl' },
    { label: '2', url: '/assets/models/2.glb' },
    { label: '3', url: '/assets/models/3.glb' },
    { label: '4', url: '/assets/models/4.glb' },
  ];

  selectedModelUrl = this.modelOptions[0].url;
  wrapMode: WrapMode = 'front';
  statusMessage = signal('Vista previa lista');
  isLoading = signal(false);
  wrapScale = 0.34;
  wrapHorizontal = 0.5;
  wrapVertical = 0.46;
  wrapOpacity = 1;
  objectColor = '#f8faf8';
  wrapOverflowsViewport = signal(false);
  isBaking = signal(false);
  stickerBaked = signal(false);
  bakeProgress = signal(0);
  hasWrapImage = signal(false);
  renderImageUrl = signal<string | null>(null);
  isRendering = signal(false);
  slowMoBake = true;
  slowMoBakeDelay = 20;

  // ── Three.js core ──────────────────────────────────────
  private readonly modelRoot = new THREE.Group();
  private readonly textureSize = 2048;
  private readonly wrapSegments = 88;
  private readonly overflowThreshold = 0.012;
  /** Separacion de la lamina, en fraccion del tamano del modelo. */
  private readonly wrapLiftRatio = 0.0032;
  /**
   * Coseno minimo entre el rayo y la normal de la cara. Por debajo, el rayo
   * roza la superficie y la imagen se estiraria mas de ~5.5x: se descarta.
   */
  private readonly wrapGrazingLimit = 0.18;
  /** Salto de profundidad admitido dentro de una celda, en anchos de celda. */
  private readonly wrapDepthTolerance = 10;
  /** Bisecciones por arista para encontrar la silueta real. */
  private readonly wrapEdgeRefineSteps = 5;

  // Vectores de trabajo: una proyeccion lanza miles de rayos por reconstruccion
  private readonly scratchOrigin = new THREE.Vector3();
  private readonly scratchDirection = new THREE.Vector3();
  private readonly scratchFaceNormal = new THREE.Vector3();
  private readonly scratchLift = new THREE.Vector3();
  private readonly raycaster = new THREE.Raycaster();
  private readonly startTime = performance.now();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private resizeObserver?: ResizeObserver;
  private frameId = 0;

  // ── Model drag ─────────────────────────────────────────
  private isDragging = false;
  private lastPointerX = 0;

  // ── Texture / wrap mesh ────────────────────────────────
  private wrapTexture?: THREE.CanvasTexture;
  private wrapImage?: HTMLImageElement;
  private wrapCanvas?: HTMLCanvasElement;
  private wrapMesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private bakedMesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private bakedPositions: number[] = [];
  private bakedUvs: number[] = [];
  private frontVisibleMinU = 0;
  private frontVisibleMaxU = 1;

  // ── Paper Mario floating sticker ───────────────────────
  private floatingPreviewMesh?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private isDraggingSticker = false;
  private stickerAnimating = false;
  private lastStickerPointerX = 0;
  private lastStickerPointerY = 0;
  private stickerVelX = 0;
  private stickerVelY = 0;
  private stickerRestPosition = new THREE.Vector3();
  private stickerTargetPosition = new THREE.Vector3();
  private stickerRestWidth = 1;
  private frontHasHorizontalOverflow = false;
  private frontCenterHasSurface = false;
  private readonly floatingSegX = 20;
  private readonly floatingSegY = 12;
  private readonly floatingZOffset = 0.14;
  private readonly stickerDragLerp = 0.24;
  private readonly stickerDefaultOpacity = 1;
  private readonly stickerDragOpacity = 0.9;
  private readonly stickerInvalidOpacity = 0.7;

  // ── Motion (GSAP) ──────────────────────────────────────
  /** Sin movimiento decorativo: cada animacion responde a un cambio de estado real. */
  @HostBinding('class.no-motion') protected readonly reduceMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private gsapCtx?: gsap.Context;

  constructor(
    private readonly ngZone: NgZone,
    private readonly hostRef: ElementRef<HTMLElement>,
  ) {
    // Cambio de estado -> lectura nueva en la barra de estado
    effect(() => {
      this.statusMessage();
      this.flashStatusReadout();
    });

    // El aviso de encuadre entra desde el filo del visor
    effect(() => {
      const chip = this.warnChip();
      if (chip) this.revealWarning(chip.nativeElement);
    });

    // El horneado termino: las escuadras confirman el encuadre congelado
    effect(() => {
      if (this.stickerBaked()) this.confirmFrameLock();
    });

    // Apertura del render exportado
    effect(() => {
      const shade = this.renderShade();
      const card = this.renderCard();
      if (shade && card) this.openRenderOverlay(shade.nativeElement, card.nativeElement);
    });
  }

  ngAfterViewInit(): void {
    this.initScene();
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
      this.resizeObserver.observe(this.canvasHost.nativeElement);
      this.resizeRenderer();
      this.animate();
    });
    this.initMotion();
    void this.loadSelectedModel();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.gsapCtx?.revert();
    this.clearModel();
    this.wrapTexture?.dispose();
    this.renderer?.dispose();
  }

  async loadSelectedModel(): Promise<void> {
    this.isLoading.set(true);
    this.statusMessage.set('Cargando modelo');
    this.clearModel();
    this.modelRoot.quaternion.identity();

    try {
      const model = this.isProceduralModel(this.selectedModelUrl)
        ? this.createProceduralModel(this.selectedModelUrl)
        : await this.loadModelFromAsset(this.selectedModelUrl);

      this.modelRoot.add(model);
      this.normalizeModel();
      this.applyBaseMaterials();
      this.rebuildShrinkWrap();
      this.frameCamera();
      this.statusMessage.set(
        this.isProceduralModel(this.selectedModelUrl)
          ? `${this.getSelectedModelLabel()} listo`
          : 'Modelo cargado desde assets',
      );
    } catch (error) {
      this.modelRoot.add(this.createBottleModel());
      this.normalizeModel();
      this.applyBaseMaterials();
      this.rebuildShrinkWrap();
      this.frameCamera();
      this.statusMessage.set('No se encontro el asset, usando botella de prueba');
      console.warn('Model load failed:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.statusMessage.set('Selecciona una imagen valida');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const image = new Image();

      image.onload = () => {
        this.wrapImage = image;
        this.hasWrapImage.set(true);
        this.resetBake();
        this.redrawWrapTexture();
        this.rebuildShrinkWrap();
        this.statusMessage.set('Arrastra el sticker para posicionarlo');
        input.value = '';
      };

      image.onerror = () => {
        this.statusMessage.set('No se pudo leer la imagen');
        input.value = '';
      };

      image.src = src;
    };
    reader.onerror = () => {
      this.statusMessage.set('No se pudo abrir la imagen');
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  setWrapMode(mode: WrapMode): void {
    if (this.wrapMode === mode) return;
    this.wrapMode = mode;
    this.syncProjectionThumb();
    this.updateWrap();
  }

  updateWrap(): void {
    if (this.stickerBaked()) return;
    if (!this.isBaking()) this.resetBake();
    this.redrawWrapTexture();
    this.rebuildShrinkWrap();
  }

  updateObjectColor(): void {
    this.applyObjectColor();
  }

  performBake(fastBake = false): void {
    if (!this.wrapImage || this.isBaking() || this.stickerBaked()) return;
    if (!this.wrapMesh || this.wrapMesh.geometry.getAttribute('position').count === 0) {
      this.statusMessage.set('Nada que hornear en la vista actual');
      return;
    }
    this.isBaking.set(true);
    this.statusMessage.set('Calculando horneado...');
    void this.runCalculatedBake(fastBake);
  }

  resetBakedSticker(): void {
    this.resetBake();
    this.rebuildShrinkWrap();
    this.statusMessage.set('Arrastra el sticker para posicionarlo');
  }

  renderBakedScene(): void {
    if (!this.stickerBaked() || this.isRendering()) return;

    this.isRendering.set(true);
    try {
      const imageUrl = this.captureStudioRender();
      this.renderImageUrl.set(imageUrl);
      this.statusMessage.set('Render listo');
    } finally {
      this.isRendering.set(false);
    }
  }

  closeRenderPreview(): void {
    const shade = this.renderShade()?.nativeElement;
    if (this.reduceMotion || !shade) {
      this.renderImageUrl.set(null);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      gsap.to(shade, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        overwrite: true,
        onComplete: () => this.ngZone.run(() => this.renderImageUrl.set(null)),
      });
    });
  }

  // ── Movimiento ─────────────────────────────────────────

  /** Arranque del equipo: primero se dibujan los filos del chasis, despues entran los modulos. */
  private initMotion(): void {
    this.syncProjectionThumb(false);
    if (this.reduceMotion) return;

    this.ngZone.runOutsideAngular(() => {
      this.gsapCtx = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.js-rule', { scaleX: 0, scaleY: 0, duration: 0.5, stagger: 0.08 })
          .from('.js-boot', { y: 8, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.3')
          .from('.js-frame', { opacity: 0, duration: 0.4, stagger: 0.05 }, '-=0.35');
      }, this.hostRef.nativeElement);
    });
  }

  /** El indicador del selector viaja al modo elegido: es la confirmacion del cambio. */
  private syncProjectionThumb(animated = true): void {
    const thumb = this.segThumb?.nativeElement;
    if (!thumb) return;

    const xPercent = this.wrapMode === 'around' ? 100 : 0;
    if (!animated || this.reduceMotion) {
      gsap.set(thumb, { xPercent });
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      gsap.to(thumb, { xPercent, duration: 0.42, ease: 'expo.out', overwrite: true });
    });
  }

  private flashStatusReadout(): void {
    const el = this.statusReadout?.nativeElement;
    if (!el || this.reduceMotion) return;

    this.ngZone.runOutsideAngular(() => {
      gsap.fromTo(
        el,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.32, ease: 'power3.out', overwrite: true },
      );
    });
  }

  private revealWarning(chip: HTMLElement): void {
    this.runAfterRender(() => {
      gsap.from(chip, { y: -8, opacity: 0, duration: 0.35, ease: 'power3.out' });
    });
  }

  private confirmFrameLock(): void {
    this.runAfterRender(() => {
      gsap.fromTo(
        this.hostRef.nativeElement.querySelectorAll('.js-frame'),
        { scale: 1.6, opacity: 0.25 },
        { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out', stagger: 0.04 },
      );
    });
  }

  private openRenderOverlay(shade: HTMLElement, card: HTMLElement): void {
    this.runAfterRender(() => {
      gsap
        .timeline()
        .to(shade, { opacity: 1, duration: 0.22, ease: 'power2.out' })
        .from(card, { y: 16, scale: 0.99, opacity: 0, duration: 0.5, ease: 'expo.out' }, 0.05);
    });
  }

  /** Los efectos pueden dispararse antes de que Angular escriba el DOM: se espera un cuadro. */
  private runAfterRender(fn: () => void): void {
    if (this.reduceMotion) return;
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        if (this.gsapCtx) this.gsapCtx.add(fn);
        else fn();
      });
    });
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isBaking()) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    // Try sticker drag first
    if (this.floatingPreviewMesh && this.wrapImage && !this.stickerBaked() && !this.stickerAnimating) {
      const hit = this.raycastScreen(event.clientX, event.clientY, [this.floatingPreviewMesh]);
      if (hit) {
        this.isDraggingSticker = true;
        this.lastStickerPointerX = event.clientX;
        this.lastStickerPointerY = event.clientY;
        this.stickerVelX = 0;
        this.stickerVelY = 0;
        this.stickerTargetPosition.copy(this.floatingPreviewMesh.position);
        this.setFloatingPreviewOpacity(this.stickerDragOpacity);
        this.animateStickerLift();
        return;
      }
    }

    // Model rotation drag
    this.isDragging = true;
    this.lastPointerX = event.clientX;
  }

  onPointerMove(event: PointerEvent): void {
    if (this.isBaking()) return;

    if (this.isDraggingSticker && this.floatingPreviewMesh) {
      const stickerZ = this.floatingPreviewMesh.position.z;
      const prevWorld = this.screenToWorldAtZ(this.lastStickerPointerX, this.lastStickerPointerY, stickerZ);
      const currWorld = this.screenToWorldAtZ(event.clientX, event.clientY, stickerZ);

      if (prevWorld && currWorld) {
        const dx = currWorld.x - prevWorld.x;
        const dy = currWorld.y - prevWorld.y;
        this.stickerTargetPosition.x += dx;
        this.stickerTargetPosition.y += dy;
        this.stepStickerDragLerp();
      }

      this.lastStickerPointerX = event.clientX;
      this.lastStickerPointerY = event.clientY;
      return;
    }

    if (!this.isDragging) return;
    const deltaX = event.clientX - this.lastPointerX;
    this.lastPointerX = event.clientX;
    this.rotateGlobal('y', deltaX * 0.01);
  }

  onPointerUp(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);

    if (this.isDraggingSticker) {
      this.isDraggingSticker = false;
      void this.handleStickerDrop();
      return;
    }

    this.isDragging = false;
  }

  // ── Sticker drop ───────────────────────────────────────

  private async handleStickerDrop(): Promise<void> {
    this.stickerAnimating = true;

    // Rebuild logical wrap at current sticker position (skip floating preview rebuild)
    this.rebuildShrinkWrap(true);

    const hasSurface = !!(
      this.wrapMesh &&
      this.wrapMesh.geometry.getAttribute('position').count > 0
    );

    if (!this.canBakeCurrentStickerDrop(hasSurface)) {
      this.stickerAnimating = false;
      if (this.floatingPreviewMesh) {
        this.stickerRestPosition.copy(this.floatingPreviewMesh.position);
        this.stickerTargetPosition.copy(this.floatingPreviewMesh.position);
        this.setFloatingPreviewOpacity(this.stickerInvalidOpacity);
        this.deformFloatingPreview(0.035, 0, 0);
      }
      this.statusMessage.set('Suelta sobre el objeto para pegar');
      return;
    }

    await this.animateStickerStamp();
    this.stickerAnimating = false;

    if (this.frontHasHorizontalOverflow) {
      // Wrap-around bake
      this.performBake(true);
    } else {
      // Front projection bake (instant)
      this.bakeCurrentFrontProjection();
    }
  }

  private bakeCurrentFrontProjection(message = 'Sticker horneado'): void {
    if (!this.wrapMesh) return;

    this.resetBake();
    const posAttr = this.wrapMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const uvAttr = this.wrapMesh.geometry.getAttribute('uv') as THREE.BufferAttribute;

    for (let i = 0; i < posAttr.count; i++) {
      this.bakedPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      this.bakedUvs.push(uvAttr.getX(i), uvAttr.getY(i));
    }

    this.rebuildBakedMesh();
    this.disposeWrapMesh();
    this.disposeFloatingPreview();
    this.wrapOverflowsViewport.set(false);
    this.stickerBaked.set(true);
    this.bakeProgress.set(0);
    this.statusMessage.set(message);
  }

  private canBakeCurrentStickerDrop(hasSurface: boolean): boolean {
    return hasSurface && this.frontCenterHasSurface;
  }

  private isStickerCenterOverSurface(): boolean {
    if (!this.wrapImage || this.wrapMode !== 'front') return false;
    this.modelRoot.updateMatrixWorld(true);
    const targetMeshes = this.getWrapTargets();
    if (targetMeshes.length === 0) return false;

    const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
    const modelSize = modelBox.getSize(new THREE.Vector3());
    const projectionCenter = new THREE.Vector3(
      THREE.MathUtils.lerp(modelBox.min.x, modelBox.max.x, this.wrapHorizontal),
      THREE.MathUtils.lerp(modelBox.min.y, modelBox.max.y, this.wrapVertical),
      modelBox.max.z + Math.max(modelSize.z, 0.5),
    );
    const far = Math.max(modelSize.x, modelSize.y, modelSize.z) * 3 + 2;
    this.raycaster.set(projectionCenter, new THREE.Vector3(0, 0, -1));
    this.raycaster.far = far;
    return this.raycaster.intersectObjects(targetMeshes, false).length > 0;
  }

  private setFloatingPreviewOpacity(opacity: number): void {
    const mesh = this.floatingPreviewMesh;
    if (!mesh) return;
    mesh.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
    mesh.material.needsUpdate = true;
  }

  private stepStickerDragLerp(force = false): void {
    const mesh = this.floatingPreviewMesh;
    if (!mesh) return;

    const previousX = mesh.position.x;
    const previousY = mesh.position.y;
    const alpha = force ? 1 : this.stickerDragLerp;

    mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, this.stickerTargetPosition.x, alpha);
    mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, this.stickerTargetPosition.y, alpha);

    const movedX = mesh.position.x - previousX;
    const movedY = mesh.position.y - previousY;
    this.stickerVelX = movedX * 0.7 + this.stickerVelX * 0.3;
    this.stickerVelY = movedY * 0.7 + this.stickerVelY * 0.3;
    this.syncWrapFromFloatingPreview();
    const hasSurface = this.isStickerCenterOverSurface();
    this.frontCenterHasSurface = hasSurface;
    this.setFloatingPreviewOpacity(hasSurface ? this.stickerDragOpacity : this.stickerInvalidOpacity);

    const lagX = this.stickerTargetPosition.x - mesh.position.x;
    const leanX = THREE.MathUtils.clamp(
      (this.stickerVelX + lagX * 0.18) / (this.stickerRestWidth * 0.08),
      -0.38,
      0.38,
    );
    const curl = THREE.MathUtils.clamp(
      0.065 + Math.abs(lagX) / Math.max(this.stickerRestWidth * 4, 0.01),
      0.045,
      0.11,
    );
    this.deformFloatingPreview(curl, leanX, 0.045);
  }

  private syncWrapFromFloatingPreview(): void {
    const mesh = this.floatingPreviewMesh;
    if (!mesh) return;

    const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
    const bw = Math.max(modelBox.max.x - modelBox.min.x, 0.01);
    const bh = Math.max(modelBox.max.y - modelBox.min.y, 0.01);
    this.wrapHorizontal = (mesh.position.x - modelBox.min.x) / bw;
    this.wrapVertical = (mesh.position.y - modelBox.min.y) / bh;
  }

  // ── Paper Mario animations ─────────────────────────────

  private animateStickerLift(): void {
    const mesh = this.floatingPreviewMesh;
    if (!mesh) return;
    const startZ = mesh.position.z;
    const targetZ = startZ + 0.10;
    const start = performance.now();
    const duration = 180;

    const tick = () => {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      if (this.floatingPreviewMesh) {
        this.floatingPreviewMesh.position.z = THREE.MathUtils.lerp(startZ, targetZ, ease);
        this.deformFloatingPreview(0.06 + ease * 0.04, 0, 0);
      }
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private animateStickerStamp(): Promise<void> {
    return new Promise((resolve) => {
      const mesh = this.floatingPreviewMesh;
      if (!mesh) { resolve(); return; }

      const startZ = mesh.position.z;
      const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
      const targetZ = modelBox.max.z + 0.006;
      const start = performance.now();
      const duration = 300;

      const tick = () => {
        const t = Math.min((performance.now() - start) / duration, 1);

        let ease: number;
        if (t < 0.65) {
          ease = Math.pow(t / 0.65, 2);
        } else {
          const sub = (t - 0.65) / 0.35;
          ease = 1 + Math.sin(sub * Math.PI) * 0.05;
        }

        if (this.floatingPreviewMesh) {
          this.floatingPreviewMesh.position.z = THREE.MathUtils.lerp(startZ, targetZ, Math.min(ease, 1));
          const flatness = Math.min(t / 0.65, 1);
          this.deformFloatingPreview((1 - flatness) * 0.06, 0, 0);
          const squash = 1 - Math.sin(t * Math.PI) * 0.05;
          this.floatingPreviewMesh.scale.y = squash;
          this.floatingPreviewMesh.scale.x = 2 - squash;
        }

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          if (this.floatingPreviewMesh) {
            this.floatingPreviewMesh.scale.set(1, 1, 1);
            this.deformFloatingPreview(0, 0, 0);
          }
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  private animateStickerReject(): Promise<void> {
    return new Promise((resolve) => {
      const mesh = this.floatingPreviewMesh;
      if (!mesh) { resolve(); return; }

      const baseZ = mesh.position.z;
      const start = performance.now();
      const duration = 400;

      const tick = () => {
        const t = Math.min((performance.now() - start) / duration, 1);
        const wobble = Math.sin(t * Math.PI * 3.5) * Math.exp(-t * 5) * 0.18;

        if (this.floatingPreviewMesh) {
          this.floatingPreviewMesh.position.z = baseZ + wobble;
          this.floatingPreviewMesh.rotation.z = Math.sin(t * Math.PI * 2.5) * Math.exp(-t * 4) * 0.06;
          this.deformFloatingPreview(0.04 + Math.abs(wobble) * 0.6, 0, 0);
        }

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          if (this.floatingPreviewMesh) {
            this.floatingPreviewMesh.position.z = baseZ;
            this.floatingPreviewMesh.rotation.z = 0;
            this.deformFloatingPreview(0.035, 0, 0);
          }
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  // ── Floating preview mesh ──────────────────────────────

  private buildFloatingPreview(modelBox: THREE.Box3, projWidth: number, projHeight: number): void {
    this.disposeFloatingPreview();
    if (!this.wrapImage) return;

    const cx = THREE.MathUtils.lerp(modelBox.min.x, modelBox.max.x, this.wrapHorizontal);
    const cy = THREE.MathUtils.lerp(modelBox.min.y, modelBox.max.y, this.wrapVertical);
    const cz = modelBox.max.z + this.floatingZOffset;

    const geo = new THREE.PlaneGeometry(projWidth, projHeight, this.floatingSegX, this.floatingSegY);
    const mat = new THREE.MeshBasicMaterial({
      map: this.ensureWrapTexture(),
      transparent: true,
      opacity: 0,
      alphaTest: 0.02,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
      side: THREE.DoubleSide,
    });

    this.floatingPreviewMesh = new THREE.Mesh(geo, mat);
    this.floatingPreviewMesh.name = 'floating-sticker-preview';
    this.floatingPreviewMesh.renderOrder = 12;
    this.floatingPreviewMesh.position.set(cx, cy, cz);
    this.scene.add(this.floatingPreviewMesh);

    this.stickerRestPosition.set(cx, cy, cz);
    this.stickerTargetPosition.set(cx, cy, cz);
    this.stickerRestWidth = projWidth;

    this.deformFloatingPreview(0.035, 0, 0);

    // Fade in
    const mesh = this.floatingPreviewMesh;
    const targetOpacity = this.stickerDefaultOpacity;
    const start = performance.now();
    const fadeDuration = 320;

    const fadeIn = () => {
      const t = Math.min((performance.now() - start) / fadeDuration, 1);
      if (mesh.material) {
        mesh.material.opacity = t * targetOpacity;
        mesh.material.needsUpdate = true;
      }
      if (t < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
  }

  private disposeFloatingPreview(): void {
    if (!this.floatingPreviewMesh) return;
    this.floatingPreviewMesh.geometry.dispose();
    this.floatingPreviewMesh.material.dispose();
    this.scene.remove(this.floatingPreviewMesh);
    this.floatingPreviewMesh = undefined;
  }

  private deformFloatingPreview(curlAmount: number, leanX: number, liftZ: number): void {
    const mesh = this.floatingPreviewMesh;
    if (!mesh) return;

    const geo = mesh.geometry;
    const params = geo.parameters;
    const segX = params.widthSegments;
    const segY = params.heightSegments;
    const w = params.width;
    const h = params.height;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;

    for (let yi = 0; yi <= segY; yi++) {
      for (let xi = 0; xi <= segX; xi++) {
        const i = yi * (segX + 1) + xi;
        const u = xi / segX;
        const v = yi / segY;

        // Original flat position (PlaneGeometry: y inverted from iy)
        const ox = (u - 0.5) * w;
        const oy = (0.5 - v) * h;

        // Edge factor: 1 at edge, 0 at center
        const edgeDist = Math.min(u, 1 - u, v, 1 - v) * 4;
        const edgeFactor = Math.max(0, 1 - edgeDist);

        // Curl: edges push back in Z
        const curlZ = -curlAmount * edgeFactor;

        // Lean: top shifts in drag direction (v=0 is top)
        const leanShiftX = leanX * (0.5 - v) * w * 0.6;

        pos.setXYZ(i, ox + leanShiftX, oy, curlZ + liftZ);
      }
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // ── Screen ↔ world helpers ─────────────────────────────

  private screenToWorldAtZ(screenX: number, screenY: number, worldZ: number): THREE.Vector3 | null {
    const canvas = this.previewCanvas.nativeElement;
    const w = Math.max(canvas.clientWidth, 1);
    const h = Math.max(canvas.clientHeight, 1);
    const ndcX = (screenX / w) * 2 - 1;
    const ndcY = -(screenY / h) * 2 + 1;
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -worldZ);
    const target = new THREE.Vector3();
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    return this.raycaster.ray.intersectPlane(plane, target) ? target : null;
  }

  private raycastScreen(
    screenX: number,
    screenY: number,
    objects: THREE.Object3D[],
  ): THREE.Intersection | undefined {
    const canvas = this.previewCanvas.nativeElement;
    const w = Math.max(canvas.clientWidth, 1);
    const h = Math.max(canvas.clientHeight, 1);
    const ndcX = (screenX / w) * 2 - 1;
    const ndcY = -(screenY / h) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    return this.raycaster.intersectObjects(objects, false)[0];
  }

  // ── Bake ───────────────────────────────────────────────

  private async runCalculatedBake(fastBake = false): Promise<void> {
    const originalQuaternion = this.modelRoot.quaternion.clone();
    const imageAspect = this.getImageAspect();
    const xSegments = Math.max(40, this.wrapSegments);
    const ySegments = Math.max(12, Math.round(this.wrapSegments / Math.max(imageAspect, 0.3)));
    const yAxis = new THREE.Vector3(0, 1, 0);

    try {
      this.resetBake();
      const targetMeshes = this.getWrapTargets();
      const metrics = this.getFrontProjectionMetrics(targetMeshes);
      const maxArc = Math.PI * 1.9;

      const visMinU = THREE.MathUtils.clamp(this.frontVisibleMinU, 0, 1);
      const visMaxU = THREE.MathUtils.clamp(this.frontVisibleMaxU, 0, 1);
      const visCenter = (visMinU + visMaxU) * 0.5;

      const centerAnchor = this.findFrontBakeAnchor(targetMeshes, metrics, visCenter);
      const fallbackAnchor = this.findFrontBakeAnchor(targetMeshes, metrics, 0.5);

      let anchorU: number;
      let anchorAngle: number;
      let radiansPerU: number;

      if (centerAnchor && visMaxU - visMinU > 0.02) {
        anchorU = visCenter;
        anchorAngle = centerAnchor.angle;
        const dz = Math.max(Math.abs(centerAnchor.point.z - metrics.modelCenter.z), 0.01);
        radiansPerU = THREE.MathUtils.clamp(metrics.projectionWidth / dz, Math.PI / 20, maxArc);
      } else {
        const stickerRadius = Math.max(fallbackAnchor?.radius ?? metrics.radius, 0.1);
        const halfSine = Math.min(metrics.projectionWidth / (2 * stickerRadius), 0.9999);
        radiansPerU = THREE.MathUtils.clamp(2 * Math.asin(halfSine), Math.PI / 10, maxArc);
        anchorU = 0.5;
        anchorAngle = fallbackAnchor?.angle ?? 0;
      }

      let bakedAnyStrip = false;
      this.bakeProgress.set(0);
      this.statusMessage.set('Pegando sticker...');

      for (let stripIndex = xSegments - 1; stripIndex >= 0; stripIndex--) {
        const sourceMinU = stripIndex / xSegments;
        const sourceMaxU = (stripIndex + 1) / xSegments;
        const sourceMidU = (sourceMinU + sourceMaxU) * 0.5;
        const stripAngle = anchorAngle + (sourceMidU - anchorU) * radiansPerU;
        const rotationAngle = -stripAngle;

        const targetQuaternion = new THREE.Quaternion().setFromAxisAngle(yAxis, rotationAngle);
        targetQuaternion.multiply(originalQuaternion);
        this.modelRoot.quaternion.copy(targetQuaternion);
        this.modelRoot.updateMatrixWorld(true);

        const progress = (xSegments - stripIndex) / xSegments;

        // Fade out floating preview as bake progresses
        if (this.floatingPreviewMesh) {
          this.floatingPreviewMesh.material.opacity = Math.max(0, 1 - progress * 1.5) * this.wrapOpacity;
          this.floatingPreviewMesh.material.needsUpdate = true;
        }

        this.bakeProgress.set(Math.round(progress * 100));

        const result = this.buildStickerStripGeometry(targetMeshes, ySegments, metrics, {
          sourceMinU,
          sourceMaxU,
          anchorU,
          anchorAngle,
          radiansPerU,
        });

        if (result.geometry.getAttribute('position').count > 0) {
          this.accumulateGeometry(result.geometry);
          bakedAnyStrip = true;

          const shouldRebuild = !fastBake && (this.slowMoBake || stripIndex % 4 === 0 || stripIndex === 0);
          if (shouldRebuild) {
            this.rebuildBakedMesh();
            this.statusMessage.set(`Pegando sticker ${xSegments - stripIndex}/${xSegments}`);
            await this.waitBakeFrame();
          }
        }

        result.geometry.dispose();
      }

      this.bakeProgress.set(100);
      this.modelRoot.quaternion.copy(originalQuaternion);
      this.modelRoot.updateMatrixWorld(true);

      if (!bakedAnyStrip) {
        this.statusMessage.set('La imagen no encontro superficie para hornear');
        return;
      }

      this.rebuildBakedMesh();
      this.disposeWrapMesh();
      this.disposeFloatingPreview();
      this.wrapOverflowsViewport.set(false);
      this.stickerBaked.set(true);
      this.bakeProgress.set(0);
      this.statusMessage.set('Sticker horneado');
    } catch (error) {
      console.warn('Bake failed:', error);
      this.modelRoot.quaternion.copy(originalQuaternion);
      this.modelRoot.updateMatrixWorld(true);
      this.statusMessage.set('No se pudo completar el horneado');
    } finally {
      this.isBaking.set(false);
    }
  }

  private async waitBakeFrame(): Promise<void> {
    const delay = this.slowMoBake ? Math.max(0, this.slowMoBakeDelay) : 0;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  private accumulateGeometry(geo: THREE.BufferGeometry): void {
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      this.bakedPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      this.bakedUvs.push(uvAttr.getX(i), uvAttr.getY(i));
    }
  }

  private rebuildBakedMesh(): void {
    this.disposeBakedMesh();
    if (this.bakedPositions.length === 0) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.bakedPositions.slice(), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.bakedUvs.slice(), 2));
    geo.computeVertexNormals();
    this.bakedMesh = new THREE.Mesh(geo, this.createShrinkWrapMaterial());
    this.bakedMesh.name = 'ray-shrinkwrap-baked';
    this.bakedMesh.renderOrder = 11;
    this.modelRoot.add(this.bakedMesh);
  }

  private captureStudioRender(): string {
    const originalBackground = this.scene.background;
    const originalCameraPosition = this.camera.position.clone();
    const originalCameraQuaternion = this.camera.quaternion.clone();
    const originalFov = this.camera.fov;
    const originalModelQuaternion = this.modelRoot.quaternion.clone();
    const studio = new THREE.Group();

    try {
      this.modelRoot.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(this.modelRoot);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 1);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(maxDimension * 4.6, maxDimension * 4.6),
        new THREE.MeshStandardMaterial({ color: '#15181a', roughness: 0.86, metalness: 0 }),
      );
      floor.name = 'render-studio-floor';
      floor.rotation.x = -Math.PI * 0.5;
      floor.position.set(center.x, box.min.y - 0.012, center.z);

      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(maxDimension * 4.6, maxDimension * 2.9),
        new THREE.MeshBasicMaterial({ color: '#101315' }),
      );
      backdrop.name = 'render-studio-backdrop';
      backdrop.position.set(center.x, center.y + maxDimension * 0.45, center.z - maxDimension * 1.45);

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(maxDimension * 0.42, 72),
        new THREE.MeshBasicMaterial({
          color: '#05070a',
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        }),
      );
      shadow.name = 'render-studio-shadow';
      shadow.rotation.x = -Math.PI * 0.5;
      shadow.scale.set(1.65, 0.62, 1);
      shadow.position.set(center.x, box.min.y + 0.002, center.z + maxDimension * 0.06);
      shadow.renderOrder = -1;

      studio.userData['skipWrap'] = true;
      studio.add(floor, backdrop, shadow);
      this.scene.add(studio);
      // El fondo de escena ya es el ciclorama; el backdrop físico da el suelo y el horizonte.

      const presentationTurn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.22);
      this.modelRoot.quaternion.copy(originalModelQuaternion).premultiply(presentationTurn);
      this.modelRoot.updateMatrixWorld(true);

      this.camera.fov = 32;
      this.camera.position.set(
        center.x + maxDimension * 0.48,
        center.y + maxDimension * 0.18,
        center.z + maxDimension * 2.05,
      );
      this.camera.lookAt(center.x, center.y + maxDimension * 0.03, center.z);
      this.camera.updateProjectionMatrix();

      this.renderer.render(this.scene, this.camera);
      return this.previewCanvas.nativeElement.toDataURL('image/png');
    } finally {
      this.scene.remove(studio);
      this.disposeObject(studio);
      this.scene.background = originalBackground;
      this.modelRoot.quaternion.copy(originalModelQuaternion);
      this.modelRoot.updateMatrixWorld(true);
      this.camera.position.copy(originalCameraPosition);
      this.camera.quaternion.copy(originalCameraQuaternion);
      this.camera.fov = originalFov;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ── Scene setup ────────────────────────────────────────

  private initScene(): void {
    this.scene = new THREE.Scene();
    // Fondo plano de visor tecnico: la retícula la dibuja la interfaz encima del canvas.
    this.scene.background = new THREE.Color('#0b0d0e');

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 1.7, 6);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.previewCanvas.nativeElement,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x0b0d0e, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const ambientLight = new THREE.HemisphereLight(0xeef3fb, 0x2a3038, 2.3);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(3, 5, 5);
    fillLight.position.set(-4, 2, 3);
    this.scene.add(ambientLight, keyLight, fillLight, this.modelRoot);
  }

  private animate = (): void => {
    this.frameId = requestAnimationFrame(this.animate);
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.camera.position.x = Math.sin(elapsed * 0.12) * 0.03;

    if (
      this.floatingPreviewMesh &&
      this.isDraggingSticker &&
      !this.stickerAnimating &&
      !this.isBaking() &&
      !this.stickerBaked()
    ) {
      this.stepStickerDragLerp();
    } else if (
      this.floatingPreviewMesh &&
      !this.isDraggingSticker &&
      !this.stickerAnimating &&
      !this.isBaking() &&
      !this.stickerBaked()
    ) {
      this.floatingPreviewMesh.position.y = this.stickerRestPosition.y + Math.sin(elapsed * 1.25) * 0.018;
      this.floatingPreviewMesh.rotation.z = Math.sin(elapsed * 0.75) * 0.011;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private resizeRenderer(): void {
    const host = this.canvasHost.nativeElement;
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // ── Model loading ──────────────────────────────────────

  private async loadModelFromAsset(url: string): Promise<THREE.Object3D> {
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension === 'glb' || extension === 'gltf') {
      const gltf = await new GLTFLoader().loadAsync(url);
      return gltf.scene;
    }
    if (extension === 'obj') return new OBJLoader().loadAsync(url);
    if (extension === 'stl') {
      const geometry = await new STLLoader().loadAsync(url);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, this.createBaseMaterial());
    }
    throw new Error(`Unsupported model extension: ${extension ?? 'unknown'}`);
  }

  private isProceduralModel(url: string): boolean {
    return url.startsWith('procedural');
  }

  private createProceduralModel(url: string): THREE.Group {
    switch (url) {
      case 'procedural-mug-studio':
        return this.createStudioMugModel();
      case 'procedural-ball':
        return this.createSportBallModel();
      case 'procedural-carton':
        return this.createCartonModel();
      case 'procedural-jerrycan':
        return this.createJerryCanModel();
      case 'procedural-pouch':
        return this.createPouchModel();
      // Modelos anteriores: ocultos del selector, siguen construibles por url
      case 'procedural-box':
        return this.createOpenBoxModel();
      case 'procedural-mug':
        return this.createMugModel();
      case 'procedural-soccer':
        return this.createSoccerBallModel();
      default:
        return this.createBottleModel();
    }
  }

  getSelectedModelLabel(): string {
    const options = [...this.modelOptions, ...this.hiddenModelOptions];
    return options.find((model) => model.url === this.selectedModelUrl)?.label ?? 'Modelo';
  }

  // ── Geometrias procedurales ────────────────────────────
  //
  // Reglas aplicadas (skill img2threejs, patrones de geometria):
  // seccion transversal real en vez de losas extruidas, bordes con radio real
  // en vez de aristas todas duras o todas suaves, piezas que se solapan en la
  // union en vez de quedar cerca, y una malla nombrada por pieza.
  // Las piezas no imprimibles llevan skipWrap para que los rayos no las tomen.

  /** Anillo de superelipse: exponente 2 da elipse, 4 o mas da rectangulo redondeado. */
  private superellipseRing(
    y: number,
    halfX: number,
    halfZ: number,
    exponent: number,
    segments: number,
    offsetX = 0,
    rotation = 0,
  ): THREE.Vector3[] {
    const ring: THREE.Vector3[] = [];
    const power = 2 / exponent;

    for (let index = 0; index < segments; index++) {
      const theta = (index / segments) * Math.PI * 2 + rotation;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      ring.push(
        new THREE.Vector3(
          offsetX + Math.sign(cos) * Math.abs(cos) ** power * halfX,
          y,
          Math.sign(sin) * Math.abs(sin) ** power * halfZ,
        ),
      );
    }

    return ring;
  }

  /**
   * Superficie cerrada a partir de anillos apilados, con tapa arriba y abajo.
   * Cada anillo aporta una seccion transversal propia: eso es lo que separa un
   * envase de una losa extruida con los cantos redondeados.
   */
  private buildLoftedGeometry(rings: THREE.Vector3[][]): THREE.BufferGeometry {
    const segments = rings[0].length;
    const positions: number[] = [];
    const indices: number[] = [];

    for (const ring of rings) {
      for (const point of ring) positions.push(point.x, point.y, point.z);
    }

    for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex++) {
      for (let index = 0; index < segments; index++) {
        const next = (index + 1) % segments;
        const a = ringIndex * segments + index;
        const b = ringIndex * segments + next;
        const c = (ringIndex + 1) * segments + index;
        const d = (ringIndex + 1) * segments + next;
        indices.push(a, c, b, b, c, d);
      }
    }

    const addCap = (ring: THREE.Vector3[], ringStart: number, upward: boolean): void => {
      const center = new THREE.Vector3();
      for (const point of ring) center.add(point);
      center.divideScalar(ring.length);

      const centerIndex = positions.length / 3;
      positions.push(center.x, center.y, center.z);

      for (let index = 0; index < segments; index++) {
        const next = (index + 1) % segments;
        if (upward) indices.push(centerIndex, ringStart + next, ringStart + index);
        else indices.push(centerIndex, ringStart + index, ringStart + next);
      }
    };

    addCap(rings[0], 0, false);
    addCap(rings[rings.length - 1], (rings.length - 1) * segments, true);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  /** Taza torneada: pared con espesor real, borde rodado, pie con chaflan y asa embebida. */
  private createStudioMugModel(): THREE.Group {
    const group = new THREE.Group();
    // DoubleSide porque la taza esta abierta: el interior es superficie visible
    const ceramic = new THREE.MeshStandardMaterial({
      color: '#f8faf8',
      metalness: 0,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    // Perfil: sube por fuera, cruza el borde y baja por dentro hasta el fondo
    const profile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.58, 0.0),
      new THREE.Vector2(0.64, 0.015),
      new THREE.Vector2(0.68, 0.06),
      new THREE.Vector2(0.715, 0.16),
      new THREE.Vector2(0.738, 0.4),
      new THREE.Vector2(0.748, 0.9),
      new THREE.Vector2(0.75, 1.55),
      new THREE.Vector2(0.746, 1.7),
      new THREE.Vector2(0.738, 1.755),
      new THREE.Vector2(0.716, 1.775),
      new THREE.Vector2(0.694, 1.755),
      new THREE.Vector2(0.686, 1.6),
      new THREE.Vector2(0.678, 0.9),
      new THREE.Vector2(0.65, 0.3),
      new THREE.Vector2(0.56, 0.13),
      new THREE.Vector2(0.3, 0.1),
      new THREE.Vector2(0.0, 0.1),
    ];

    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), ceramic);
    body.name = 'printable-mug-body';
    body.userData['preserveMaterial'] = true;

    // Asa: correa aplanada, con los dos extremos metidos dentro de la pared
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.66, 1.36, 0),
      new THREE.Vector3(0.95, 1.34, 0),
      new THREE.Vector3(1.13, 1.08, 0),
      new THREE.Vector3(1.11, 0.74, 0),
      new THREE.Vector3(0.9, 0.5, 0),
      new THREE.Vector3(0.64, 0.45, 0),
    ]);

    const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 120, 0.078, 24, false), ceramic);
    handle.name = 'mug-handle';
    handle.scale.z = 0.7;
    // Comparte material con el cuerpo: el color del objeto sigue mandando sobre el asa
    handle.userData['preserveMaterial'] = true;
    handle.userData['skipWrap'] = true;

    group.add(body, handle);
    group.rotation.y = -0.34;
    return group;
  }

  /**
   * Fusiona vertices coincidentes y devuelve la geometria indexada, para poder
   * desplazar cada vertice una sola vez y que las normales salgan continuas.
   */
  private indexSharedVertices(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const source = geometry.getAttribute('position') as THREE.BufferAttribute;
    const lookup = new Map<string, number>();
    const positions: number[] = [];
    const indices: number[] = [];

    for (let vertex = 0; vertex < source.count; vertex++) {
      const x = source.getX(vertex);
      const y = source.getY(vertex);
      const z = source.getZ(vertex);
      const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;

      let index = lookup.get(key);
      if (index === undefined) {
        index = positions.length / 3;
        lookup.set(key, index);
        positions.push(x, y, z);
      }
      indices.push(index);
    }

    const indexed = new THREE.BufferGeometry();
    indexed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    indexed.setIndex(indices);
    geometry.dispose();
    return indexed;
  }

  /** Balon: esfera geodesica con las 30 costuras del icosaedro hundidas en la superficie. */
  private createSportBallModel(): THREE.Group {
    const group = new THREE.Group();
    // Nivel 6: la costura mide ~0.045 rad y necesita varios vertices de ancho,
    // con menos subdivision el suavizado de normales se la come.
    const geometry = this.indexSharedVertices(new THREE.IcosahedronGeometry(1, 6));
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;

    // Vertices unicos del icosaedro base y las aristas que los unen
    const seedPosition = new THREE.IcosahedronGeometry(1, 0).getAttribute('position');
    const nodes: THREE.Vector3[] = [];
    for (let index = 0; index < seedPosition.count; index++) {
      const candidate = new THREE.Vector3().fromBufferAttribute(seedPosition, index).normalize();
      if (!nodes.some((node) => node.distanceToSquared(candidate) < 1e-6)) nodes.push(candidate);
    }

    const seams: { a: THREE.Vector3; b: THREE.Vector3; normal: THREE.Vector3; span: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const span = nodes[i].dot(nodes[j]);
        if (span < 0.4 || span > 0.5) continue;
        seams.push({
          a: nodes[i],
          b: nodes[j],
          normal: new THREE.Vector3().crossVectors(nodes[i], nodes[j]).normalize(),
          span,
        });
      }
    }

    const vertex = new THREE.Vector3();
    const projected = new THREE.Vector3();
    // La subdivision del icosaedro deja vertices justo sobre cada arista, asi que
    // la costura se puede estrechar sin que quede submuestreada.
    const grooveDepth = 0.045;
    const grooveWidth = 0.045;
    const panelBulge = 0.009;
    const panelWidth = 0.3;

    for (let index = 0; index < position.count; index++) {
      vertex.fromBufferAttribute(position, index).normalize();
      let nearest = Math.PI;

      for (const seam of seams) {
        const offAxis = vertex.dot(seam.normal);
        projected.copy(vertex).addScaledVector(seam.normal, -offAxis).normalize();
        const distance =
          projected.dot(seam.a) >= seam.span && projected.dot(seam.b) >= seam.span
            ? Math.asin(Math.min(1, Math.abs(offAxis)))
            : Math.min(vertex.angleTo(seam.a), vertex.angleTo(seam.b));
        if (distance < nearest) nearest = distance;
      }

      const radius =
        1 +
        panelBulge * (1 - Math.exp(-((nearest / panelWidth) ** 2))) -
        grooveDepth * Math.exp(-((nearest / grooveWidth) ** 2));
      position.setXYZ(index, vertex.x * radius, vertex.y * radius, vertex.z * radius);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    const ball = new THREE.Mesh(geometry, this.createBaseMaterial());
    ball.name = 'printable-ball';
    ball.position.y = 1;

    group.add(ball);
    return group;
  }

  /** Caja de carton cerrada: aristas con radio real y precinto en la tapa. */
  private createCartonModel(): THREE.Group {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new RoundedBoxGeometry(1.62, 2.24, 0.94, 6, 0.045),
      this.createBaseMaterial(),
    );
    body.name = 'printable-carton';
    body.position.y = 1.12;

    const tapeMaterial = new THREE.MeshStandardMaterial({
      color: '#b8bcc0',
      metalness: 0.05,
      roughness: 0.55,
    });
    const tape = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.012, 0.2), tapeMaterial);
    tape.name = 'carton-tape';
    tape.position.y = 2.242;
    tape.userData['skipWrap'] = true;

    group.add(body, tape);
    group.rotation.y = -0.28;
    return group;
  }

  /** Bidon: cuerpo de seccion rectangular redondeada, cuello descentrado y asa moldeada. */
  private createJerryCanModel(): THREE.Group {
    const group = new THREE.Group();
    const segments = 96;

    // [y, semiancho, semiprofundo, exponente, desplazamiento del centro]
    const sections: [number, number, number, number, number][] = [
      [0.0, 0.5, 0.32, 4.5, 0],
      [0.05, 0.6, 0.4, 5, 0],
      [0.16, 0.65, 0.44, 5.2, 0],
      [0.6, 0.665, 0.45, 5.2, 0],
      [1.35, 0.665, 0.45, 5.2, 0],
      [1.62, 0.655, 0.445, 5, 0.01],
      [1.9, 0.62, 0.43, 4.6, 0.03],
      [2.16, 0.55, 0.4, 4, 0.06],
      [2.36, 0.44, 0.34, 3.2, 0.09],
      [2.5, 0.32, 0.27, 2.6, 0.12],
      [2.6, 0.21, 0.2, 2.2, 0.14],
      [2.66, 0.17, 0.17, 2, 0.15],
      [2.86, 0.17, 0.17, 2, 0.15],
    ];

    const rings = sections.map(([y, halfX, halfZ, exponent, offsetX]) =>
      this.superellipseRing(y, halfX, halfZ, exponent, segments, offsetX),
    );

    const body = new THREE.Mesh(this.buildLoftedGeometry(rings), this.createBaseMaterial());
    body.name = 'printable-jerrycan-body';

    // Asa moldeada sobre el hombro, con los extremos metidos en el cuerpo
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, 2.24, 0),
      new THREE.Vector3(-0.44, 2.44, 0),
      new THREE.Vector3(-0.6, 2.4, 0),
      new THREE.Vector3(-0.66, 2.15, 0),
      new THREE.Vector3(-0.58, 1.94, 0),
    ]);
    const handle = new THREE.Mesh(
      new THREE.TubeGeometry(handleCurve, 96, 0.085, 20, false),
      this.createBaseMaterial(),
    );
    handle.name = 'jerrycan-handle';
    handle.scale.z = 0.85;

    const capMaterial = new THREE.MeshStandardMaterial({
      color: '#2f3438',
      metalness: 0.1,
      roughness: 0.45,
    });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.24, 64), capMaterial);
    cap.name = 'jerrycan-cap';
    cap.position.set(0.15, 2.92, 0);
    cap.userData['skipWrap'] = true;

    group.add(body, handle, cap);
    group.rotation.y = -0.24;
    return group;
  }

  /** Pouch tipo doypack: fondo con fuelle, panza y sello superior aplanado. */
  private createPouchModel(): THREE.Group {
    const group = new THREE.Group();
    const segments = 96;

    // [y, semiancho, semiprofundo, exponente, desplazamiento, giro]
    const sections: [number, number, number, number, number, number][] = [
      [0.0, 0.44, 0.13, 2.6, 0, 0],
      [0.04, 0.54, 0.24, 3, 0, 0.005],
      [0.16, 0.62, 0.36, 3.2, 0.005, 0.01],
      [0.45, 0.68, 0.44, 3.4, 0.01, 0.018],
      [0.95, 0.705, 0.47, 3.5, 0.012, 0.024],
      [1.45, 0.69, 0.45, 3.4, 0.01, 0.022],
      [1.85, 0.665, 0.4, 3.2, 0.005, 0.016],
      [2.15, 0.635, 0.31, 3, 0, 0.01],
      [2.36, 0.605, 0.18, 2.6, -0.005, 0.005],
      [2.5, 0.585, 0.075, 2.2, -0.008, 0],
      [2.58, 0.575, 0.035, 2, -0.01, 0],
    ];

    const rings = sections.map(([y, halfX, halfZ, exponent, offsetX, rotation]) =>
      this.superellipseRing(y, halfX, halfZ, exponent, segments, offsetX, rotation),
    );

    const pouch = new THREE.Mesh(this.buildLoftedGeometry(rings), this.createBaseMaterial());
    pouch.name = 'printable-pouch';

    group.add(pouch);
    group.rotation.y = -0.3;
    return group;
  }

  private createBottleModel(): THREE.Group {
    const group = new THREE.Group();
    const profile = [
      new THREE.Vector2(0.33, 0),
      new THREE.Vector2(0.51, 0.08),
      new THREE.Vector2(0.58, 0.24),
      new THREE.Vector2(0.55, 0.5),
      new THREE.Vector2(0.48, 0.65),
      new THREE.Vector2(0.47, 2.35),
      new THREE.Vector2(0.34, 2.9),
      new THREE.Vector2(0.23, 3.05),
      new THREE.Vector2(0.22, 3.45),
      new THREE.Vector2(0.33, 3.5),
    ];
    const bodyGeometry = new THREE.LatheGeometry(profile, 96);
    bodyGeometry.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeometry, this.createBaseMaterial());
    body.name = 'printable-bottle-body';

    const capGeometry = new THREE.CylinderGeometry(0.38, 0.34, 0.5, 96);
    const capMaterial = new THREE.MeshStandardMaterial({ color: '#b9bec3', metalness: 0.65, roughness: 0.22 });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.name = 'metal-cap';
    cap.position.y = 3.76;
    cap.userData['skipWrap'] = true;

    group.add(body, cap);
    return group;
  }

  private createOpenBoxModel(): THREE.Group {
    const group = new THREE.Group();
    const cardboard = new THREE.MeshStandardMaterial({ color: '#c58d4f', metalness: 0, roughness: 0.72 });
    const edge = new THREE.MeshStandardMaterial({ color: '#a66f38', metalness: 0, roughness: 0.78 });

    const addPanel = (
      name: string,
      size: [number, number, number],
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
      material: THREE.Material = cardboard,
    ): THREE.Mesh => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      panel.name = name;
      panel.position.set(...position);
      panel.rotation.set(...rotation);
      panel.userData['preserveMaterial'] = true;
      group.add(panel);
      return panel;
    };

    addPanel('box-bottom-printable', [2.15, 0.08, 1.55], [0, 0.04, 0]);
    addPanel('box-front-printable', [2.15, 1.05, 0.08], [0, 0.58, 0.78]);
    addPanel('box-back-printable', [2.15, 1.05, 0.08], [0, 0.58, -0.78]);
    addPanel('box-left-printable', [0.08, 1.05, 1.55], [-1.08, 0.58, 0]);
    addPanel('box-right-printable', [0.08, 1.05, 1.55], [1.08, 0.58, 0]);

    addPanel('box-front-flap', [2.15, 0.58, 0.07], [0, 1.24, 1.05], [Math.PI * 0.34, 0, 0], edge);
    addPanel('box-back-flap', [2.15, 0.58, 0.07], [0, 1.24, -1.05], [-Math.PI * 0.34, 0, 0], edge);
    addPanel('box-left-flap', [0.07, 0.58, 1.55], [-1.35, 1.24, 0], [0, 0, -Math.PI * 0.34], edge);
    addPanel('box-right-flap', [0.07, 0.58, 1.55], [1.35, 1.24, 0], [0, 0, Math.PI * 0.34], edge);

    group.rotation.y = -0.35;
    return group;
  }

  private createMugModel(): THREE.Group {
    const group = new THREE.Group();
    const ceramic = new THREE.MeshStandardMaterial({ color: '#fbfbf8', metalness: 0, roughness: 0.28 });

    const bodyGeometry = new THREE.CylinderGeometry(0.78, 0.7, 1.65, 112, 2, true);
    bodyGeometry.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeometry, ceramic);
    body.name = 'printable-mug-body';
    body.position.y = 0.86;
    body.userData['preserveMaterial'] = true;

    const bottomGeometry = new THREE.CylinderGeometry(0.68, 0.7, 0.08, 112);
    const bottom = new THREE.Mesh(bottomGeometry, ceramic);
    bottom.name = 'mug-bottom';
    bottom.position.y = 0.04;
    bottom.userData['preserveMaterial'] = true;

    const lipGeometry = new THREE.TorusGeometry(0.76, 0.035, 16, 112);
    const lip = new THREE.Mesh(lipGeometry, ceramic);
    lip.name = 'mug-lip';
    lip.position.y = 1.69;
    lip.rotation.x = Math.PI * 0.5;
    lip.userData['preserveMaterial'] = true;

    const handleGeometry = new THREE.TorusGeometry(0.43, 0.065, 18, 72);
    const handle = new THREE.Mesh(handleGeometry, ceramic);
    handle.name = 'mug-handle';
    handle.position.set(0.78, 0.92, 0);
    handle.scale.set(0.72, 1.08, 0.72);
    handle.rotation.y = Math.PI * 0.5;
    handle.userData['preserveMaterial'] = true;

    group.add(body, bottom, lip, handle);
    group.rotation.y = -0.18;
    return group;
  }

  private createSoccerBallModel(): THREE.Group {
    const group = new THREE.Group();
    const ballMaterial = new THREE.MeshStandardMaterial({ color: '#fafafa', metalness: 0, roughness: 0.38 });
    const patchMaterial = new THREE.MeshStandardMaterial({ color: '#111111', metalness: 0, roughness: 0.48 });

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.95, 96, 48), ballMaterial);
    ball.name = 'printable-soccer-ball';
    ball.userData['preserveMaterial'] = true;
    group.add(ball);

    const patchNormals = [
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0.64, 0.22, 0.74),
      new THREE.Vector3(-0.64, 0.22, 0.74),
      new THREE.Vector3(0.36, -0.58, 0.73),
      new THREE.Vector3(-0.36, -0.58, 0.73),
      new THREE.Vector3(0, 0.72, 0.69),
    ];

    for (const normal of patchNormals) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.16, 5), patchMaterial);
      normal.normalize();
      patch.name = 'soccer-black-panel';
      patch.position.copy(normal).multiplyScalar(0.958);
      patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      patch.rotateZ(Math.PI / 5);
      patch.userData['skipWrap'] = true;
      group.add(patch);
    }

    group.rotation.y = -0.22;
    return group;
  }

  private normalizeModel(): void {
    this.modelRoot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    const scale = size.y > 0 ? 3.85 / size.y : 3.2 / maxDimension;
    this.modelRoot.scale.setScalar(scale);
    this.modelRoot.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(this.modelRoot);
    const center = scaledBox.getCenter(new THREE.Vector3());
    this.modelRoot.position.x -= center.x;
    this.modelRoot.position.z -= center.z;
    this.modelRoot.position.y -= scaledBox.min.y;
    this.modelRoot.updateMatrixWorld(true);
  }

  private frameCamera(): void {
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    this.camera.position.set(0, center.y + maxDimension * 0.03, maxDimension * 2);
    this.camera.lookAt(center.x, center.y, center.z);
    this.camera.updateProjectionMatrix();
  }

  private applyBaseMaterials(): void {
    this.modelRoot.traverse((object) => {
      if (!this.isMesh(object)) return;
      if (object.userData['skipWrap'] !== true) {
        object.geometry.computeVertexNormals();
        (object.geometry as BvhGeometry).computeBoundsTree?.();
        if (object.userData['preserveMaterial'] !== true) {
          object.material = this.createBaseMaterial();
        }
      }
    });
    this.applyObjectColor();
  }

  private applyObjectColor(): void {
    const color = new THREE.Color(this.objectColor);
    this.modelRoot.traverse((object) => {
      if (
        !this.isMesh(object) ||
        object === this.wrapMesh ||
        object === this.bakedMesh ||
        object.userData['skipWrap'] === true
      ) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        const coloredMaterial = material as THREE.Material & { color?: THREE.Color };
        if (coloredMaterial.color instanceof THREE.Color) {
          coloredMaterial.color.copy(color);
          coloredMaterial.needsUpdate = true;
        }
      }
    });
  }

  // ── Shrink wrap rebuild ────────────────────────────────

  private rebuildShrinkWrap(skipFloatingPreview = false): void {
    this.disposeWrapMesh();
    this.frontCenterHasSurface = false;
    if (!skipFloatingPreview) this.disposeFloatingPreview();

    if (!this.wrapImage) return;

    this.modelRoot.updateMatrixWorld(true);
    const targetMeshes = this.getWrapTargets();
    if (targetMeshes.length === 0) return;

    const imageAspect = this.wrapImage.width / Math.max(this.wrapImage.height, 1);
    const xSegments = this.wrapSegments;
    const ySegments = Math.max(12, Math.round(this.wrapSegments / Math.max(imageAspect, 0.3)));

    if (this.wrapMode === 'around') {
      const geometry = this.buildRadialShrinkwrappedGeometry(targetMeshes, imageAspect, xSegments, ySegments);
      this.wrapOverflowsViewport.set(false);
      this.frontHasHorizontalOverflow = false;
      this.frontCenterHasSurface = false;

      if (geometry.getAttribute('position').count === 0) {
        geometry.dispose();
        this.statusMessage.set('La imagen no encontro superficie alrededor');
        return;
      }

      this.wrapMesh = new THREE.Mesh(geometry, this.createShrinkWrapMaterial());
      this.wrapMesh.name = 'ray-shrinkwrap-print';
      this.wrapMesh.renderOrder = 10;
      this.modelRoot.add(this.wrapMesh);
    } else {
      const result = this.buildFrontShrinkwrappedGeometry(targetMeshes, xSegments, ySegments);
      this.frontVisibleMinU = result.visibleMinU;
      this.frontVisibleMaxU = result.visibleMaxU;
      this.frontHasHorizontalOverflow = result.horizontalOverflows;
      this.frontCenterHasSurface = result.centerHit;
      this.wrapOverflowsViewport.set(result.overflows);

      const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
      const modelSize = modelBox.getSize(new THREE.Vector3());
      const projWidth = Math.max(modelSize.x, modelSize.z) * (0.2 + this.wrapScale * 1.6);
      const projHeight = projWidth / this.getImageAspect();

      if (result.geometry.getAttribute('position').count === 0) {
        result.geometry.dispose();
        this.statusMessage.set('La imagen no encontro superficie al frente');
        if (!skipFloatingPreview) this.buildFloatingPreview(modelBox, projWidth, projHeight);
        return;
      }

      // wrapMesh is invisible — used only for logical calculations & bakeCurrentFrontProjection
      this.wrapMesh = new THREE.Mesh(result.geometry, this.createShrinkWrapMaterial());
      this.wrapMesh.name = 'ray-shrinkwrap-print';
      this.wrapMesh.renderOrder = 10;
      this.wrapMesh.visible = false;
      this.modelRoot.add(this.wrapMesh);

      if (!skipFloatingPreview) this.buildFloatingPreview(modelBox, projWidth, projHeight);
    }
  }

  // ── Projection metrics ─────────────────────────────────

  private getFrontProjectionMetrics(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
  ): FrontProjectionMetrics {
    const fullBox = new THREE.Box3().setFromObject(this.modelRoot);
    const inverseRoot = this.modelRoot.matrixWorld.clone().invert();
    const localBox = fullBox.clone().applyMatrix4(inverseRoot);

    const modelBox = this.getLocalTargetBox(targetMeshes);
    const modelSize = localBox.getSize(new THREE.Vector3());
    const modelCenter = modelBox.getCenter(new THREE.Vector3());
    const verticalCenter = THREE.MathUtils.lerp(localBox.min.y, localBox.max.y, this.wrapVertical);
    const center = new THREE.Vector3(
      THREE.MathUtils.lerp(localBox.min.x, localBox.max.x, this.wrapHorizontal),
      verticalCenter,
      localBox.max.z + Math.max(modelSize.z, 0.5),
    );
    const projectionWidth = Math.max(modelSize.x, modelSize.z) * (0.2 + this.wrapScale * 1.6);
    const projectionHeight = projectionWidth / this.getImageAspect();
    const radius = this.estimateRadiusAtY(targetMeshes, modelBox, verticalCenter);

    return { projectionWidth, projectionHeight, center, modelCenter, radius };
  }

  private estimateRadiusAtY(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    modelBox: THREE.Box3,
    y: number,
  ): number {
    const samples = 64;
    const sz = modelBox.getSize(new THREE.Vector3());
    const z = modelBox.max.z + Math.max(sz.z, 0.5);
    const localDirection = new THREE.Vector3(0, 0, -1);
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;

    for (let index = 0; index <= samples; index++) {
      const x = THREE.MathUtils.lerp(modelBox.min.x, modelBox.max.x, index / samples);
      const worldOrigin = new THREE.Vector3(x, y, z);
      const worldDirection = localDirection.clone();
      this.modelRoot.localToWorld(worldOrigin);
      worldDirection.transformDirection(this.modelRoot.matrixWorld);
      this.raycaster.set(worldOrigin, worldDirection);
      this.raycaster.far = Math.max(sz.x, sz.z) * 4 + 4;

      const hit = this.raycaster.intersectObjects(targetMeshes, false)[0];
      if (!hit) continue;

      const localHit = hit.point.clone();
      this.modelRoot.worldToLocal(localHit);
      minX = Math.min(minX, localHit.x);
      maxX = Math.max(maxX, localHit.x);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || maxX <= minX) {
      return Math.max(sz.x, sz.z) * 0.5;
    }
    return Math.max((maxX - minX) * 0.5, 0.05);
  }

  private findFrontBakeAnchor(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    metrics: FrontProjectionMetrics,
    u: number,
  ): BakeAnchor | undefined {
    const worldOrigin = new THREE.Vector3(
      metrics.center.x + (u - 0.5) * metrics.projectionWidth,
      metrics.center.y,
      metrics.center.z,
    );
    const worldDirection = new THREE.Vector3(0, 0, -1);
    this.modelRoot.localToWorld(worldOrigin);
    worldDirection.transformDirection(this.modelRoot.matrixWorld);
    this.raycaster.set(worldOrigin, worldDirection);
    this.raycaster.far = Math.max(metrics.projectionWidth, metrics.projectionHeight, metrics.radius) * 4 + 4;

    const hit = this.raycaster.intersectObjects(targetMeshes, false)[0];
    if (!hit) return undefined;

    const localPoint = hit.point.clone();
    this.modelRoot.worldToLocal(localPoint);
    const dx = localPoint.x - metrics.modelCenter.x;
    const dz = localPoint.z - metrics.modelCenter.z;
    const radius = Math.hypot(dx, dz);
    if (radius <= 0.0001) return undefined;

    return { angle: Math.atan2(dx, dz), radius, point: localPoint };
  }

  // ── Geometry builders ──────────────────────────────────

  private ensureWrapTexture(): THREE.CanvasTexture {
    if (this.wrapTexture) return this.wrapTexture;
    this.wrapCanvas = document.createElement('canvas');
    this.wrapCanvas.width = this.textureSize;
    this.wrapCanvas.height = this.textureSize;
    this.wrapTexture = new THREE.CanvasTexture(this.wrapCanvas);
    this.wrapTexture.colorSpace = THREE.SRGBColorSpace;
    // La lamina se ve casi siempre en angulo: sin anisotropia la impresion
    // se emborrona justo donde la superficie se va de canto.
    this.wrapTexture.anisotropy = this.renderer?.capabilities.getMaxAnisotropy() ?? 1;
    this.wrapTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.wrapTexture.magFilter = THREE.LinearFilter;
    this.wrapTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.wrapTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.wrapTexture.generateMipmaps = true;
    return this.wrapTexture;
  }

  private redrawWrapTexture(): void {
    const texture = this.ensureWrapTexture();
    const canvas = this.wrapCanvas;
    if (!canvas) return;

    if (this.wrapImage) {
      // El lienzo toma la relacion de aspecto de la imagen y esta lo llena entero.
      // La lamina proyectada se construye con esa misma relacion, asi que UV 0..1
      // es exactamente la imagen: antes se enmarcaba en un cuadrado y el mapeo
      // la estiraba por su propio factor de aspecto.
      const aspect = this.getImageAspect();
      const width = aspect >= 1 ? this.textureSize : Math.max(1, Math.round(this.textureSize * aspect));
      const height = aspect >= 1 ? Math.max(1, Math.round(this.textureSize / aspect)) : this.textureSize;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (this.wrapImage) {
      context.globalAlpha = this.wrapOpacity;
      context.drawImage(this.wrapImage, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
    }

    texture.needsUpdate = true;
  }

  private buildFrontShrinkwrappedGeometry(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    xSegments: number,
    ySegments: number,
    options: FrontProjectionOptions = {},
  ): FrontProjectionResult {
    const sourceMinU = options.sourceMinU ?? 0;
    const sourceMaxU = options.sourceMaxU ?? 1;
    const placementMinU = options.placementMinU ?? 0;
    const placementMaxU = options.placementMaxU ?? 1;
    const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
    const modelSize = modelBox.getSize(new THREE.Vector3());
    const projectionWidth = Math.max(modelSize.x, modelSize.z) * (0.2 + this.wrapScale * 1.6);
    const projectionHeight = projectionWidth / this.getImageAspect();
    const projectionCenter = new THREE.Vector3(
      THREE.MathUtils.lerp(modelBox.min.x, modelBox.max.x, this.wrapHorizontal),
      THREE.MathUtils.lerp(modelBox.min.y, modelBox.max.y, this.wrapVertical),
      modelBox.max.z + Math.max(modelSize.z, 0.5),
    );
    const cell = Math.max(projectionWidth / xSegments, projectionHeight / ySegments);

    // Haz paralelo lanzado desde el frente del encuadre
    const field: ProjectionField = {
      far: Math.max(modelSize.x, modelSize.y, modelSize.z) * 3 + 2,
      lift: this.getWrapLift(modelSize),
      depthTolerance: cell * this.wrapDepthTolerance,
      ray: (gu, _gv, origin, direction) => {
        const placementU = THREE.MathUtils.lerp(placementMinU, placementMaxU, gu);
        origin.set(
          projectionCenter.x + (placementU - 0.5) * projectionWidth,
          projectionCenter.y + (_gv - 0.5) * projectionHeight,
          projectionCenter.z,
        );
        direction.set(0, 0, -1);
      },
      uv: (gu, gv, out) => out.set(THREE.MathUtils.lerp(sourceMinU, sourceMaxU, gu), gv),
    };

    const centerHit = this.castProjectionRay(field, targetMeshes, 0.5, 0.5).hit;
    const surface = this.buildProjectedSurface(field, targetMeshes, xSegments, ySegments);

    const visibleMinU = surface.hasHit
      ? THREE.MathUtils.lerp(sourceMinU, sourceMaxU, surface.minGu)
      : 0;
    const visibleMaxU = surface.hasHit
      ? THREE.MathUtils.lerp(sourceMinU, sourceMaxU, surface.maxGu)
      : 0;
    const visibleMinV = surface.hasHit ? surface.minGv : 0;
    const visibleMaxV = surface.hasHit ? surface.maxGv : 0;

    const leftOverflow = surface.hasHit && visibleMinU > this.overflowThreshold;
    const rightOverflow = surface.hasHit && visibleMaxU < 1 - this.overflowThreshold;
    const bottomOverflow = surface.hasHit && visibleMinV > this.overflowThreshold;
    const topOverflow = surface.hasHit && visibleMaxV < 1 - this.overflowThreshold;

    return {
      geometry: this.toWrapGeometry(surface),
      overflows: leftOverflow || rightOverflow || bottomOverflow || topOverflow,
      horizontalOverflows: leftOverflow || rightOverflow,
      verticalOverflows: bottomOverflow || topOverflow,
      centerHit,
      visibleMinU,
      visibleMaxU,
      visibleMinV,
      visibleMaxV,
    };
  }

  private buildStickerStripGeometry(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    ySegments: number,
    metrics: FrontProjectionMetrics,
    options: StickerStripOptions,
  ): { geometry: THREE.BufferGeometry } {
    const rayRadius = metrics.radius + Math.max(metrics.projectionWidth, metrics.projectionHeight) + 1;
    const yMin = metrics.center.y - metrics.projectionHeight * 0.5;
    const yMax = metrics.center.y + metrics.projectionHeight * 0.5;
    const stripArc = Math.abs(options.sourceMaxU - options.sourceMinU) * options.radiansPerU * metrics.radius;
    const cell = Math.max(stripArc, metrics.projectionHeight / ySegments);

    // Tira radial: el mismo haz que el modo Rodear, pero de una sola columna
    const field: ProjectionField = {
      far: rayRadius * 2 + metrics.radius * 2 + 2,
      lift: this.getWrapLift(new THREE.Vector3().setScalar(metrics.radius * 2)),
      depthTolerance: cell * this.wrapDepthTolerance,
      ray: (gu, gv, origin, direction) => {
        const u = THREE.MathUtils.lerp(options.sourceMinU, options.sourceMaxU, gu);
        const angle = options.anchorAngle + (u - options.anchorU) * options.radiansPerU;
        origin.set(
          metrics.modelCenter.x + Math.sin(angle) * rayRadius,
          THREE.MathUtils.lerp(yMin, yMax, gv),
          metrics.modelCenter.z + Math.cos(angle) * rayRadius,
        );
        direction
          .set(metrics.modelCenter.x - origin.x, 0, metrics.modelCenter.z - origin.z)
          .normalize();
        this.modelRoot.localToWorld(origin);
        direction.transformDirection(this.modelRoot.matrixWorld);
      },
      uv: (gu, gv, out) =>
        out.set(THREE.MathUtils.lerp(options.sourceMinU, options.sourceMaxU, gu), gv),
    };

    const surface = this.buildProjectedSurface(field, targetMeshes, 1, ySegments);
    return { geometry: this.toWrapGeometry(surface) };
  }

  private buildRadialShrinkwrappedGeometry(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    imageAspect: number,
    xSegments: number,
    ySegments: number,
  ): THREE.BufferGeometry {
    const modelBox = this.getLocalTargetBox(targetMeshes);
    const modelSize = modelBox.getSize(new THREE.Vector3());
    const modelCenter = modelBox.getCenter(new THREE.Vector3());
    const radius = Math.max(modelSize.x, modelSize.z) * 0.75 + 0.75;
    const far = radius * 2 + Math.max(modelSize.x, modelSize.z) + 2;
    const normalizedScale = THREE.MathUtils.clamp((this.wrapScale - 0.08) / 0.92, 0, 1);
    const angularSpan = THREE.MathUtils.lerp(Math.PI / 8, Math.PI * 2, normalizedScale);
    const centerAngle = THREE.MathUtils.lerp(-Math.PI, Math.PI, this.wrapHorizontal);
    const projectionWidth = Math.max(modelSize.x, modelSize.z) * (0.2 + this.wrapScale * 1.6);
    const projectionHeight = Math.min(modelSize.y, projectionWidth / imageAspect);
    const verticalCenter = THREE.MathUtils.lerp(modelBox.min.y, modelBox.max.y, this.wrapVertical);
    const yMin = verticalCenter - projectionHeight * 0.5;
    const yMax = verticalCenter + projectionHeight * 0.5;
    const surfaceRadius = Math.max(modelSize.x, modelSize.z) * 0.5;
    const cell = Math.max(
      (angularSpan * surfaceRadius) / xSegments,
      projectionHeight / ySegments,
    );

    // Haz radial: cada rayo entra perpendicular al eje, apuntando al centro
    const field: ProjectionField = {
      far,
      lift: this.getWrapLift(modelSize),
      depthTolerance: cell * this.wrapDepthTolerance,
      ray: (gu, gv, origin, direction) => {
        const angle = centerAngle + (gu - 0.5) * angularSpan;
        origin.set(
          modelCenter.x + Math.sin(angle) * radius,
          THREE.MathUtils.lerp(yMin, yMax, gv),
          modelCenter.z + Math.cos(angle) * radius,
        );
        direction.set(modelCenter.x - origin.x, 0, modelCenter.z - origin.z).normalize();
        this.modelRoot.localToWorld(origin);
        direction.transformDirection(this.modelRoot.matrixWorld);
      },
      uv: (gu, gv, out) => out.set(gu, gv),
    };

    return this.toWrapGeometry(this.buildProjectedSurface(field, targetMeshes, xSegments, ySegments));
  }

  // ── Muestreo por rayos ─────────────────────────────────

  /**
   * Lanza un rayo del campo y devuelve el vertice proyectado.
   * Descarta caras de espaldas y caras casi tangentes al rayo, que son las que
   * producen el estirado de la imagen en el borde del objeto.
   */
  private castProjectionRay(
    field: ProjectionField,
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    gu: number,
    gv: number,
  ): RaySample {
    const origin = this.scratchOrigin;
    const direction = this.scratchDirection;
    field.ray(gu, gv, origin, direction);

    const uv = new THREE.Vector2();
    field.uv(gu, gv, uv);

    this.raycaster.set(origin, direction);
    this.raycaster.far = field.far;
    const hits = this.raycaster.intersectObjects(targetMeshes, false);

    let fallback: THREE.Intersection | undefined;

    for (const hit of hits) {
      if (!hit.face) continue;

      // Normal geometrica: define si la cara mira al rayo y cuanto se estira la imagen
      const faceNormal = this.scratchFaceNormal
        .copy(hit.face.normal)
        .transformDirection(hit.object.matrixWorld);
      const facing = -faceNormal.dot(direction);

      if (facing >= this.wrapGrazingLimit) return this.toSample(hit, faceNormal, field, uv);

      // Mallas con winding invertido: se acepta la cara, pero solo si no roza
      if (!fallback && Math.abs(facing) >= this.wrapGrazingLimit) fallback = hit;
    }

    if (fallback && fallback.face) {
      const faceNormal = this.scratchFaceNormal
        .copy(fallback.face.normal)
        .transformDirection(fallback.object.matrixWorld);
      return this.toSample(fallback, faceNormal, field, uv);
    }

    const missed = origin.clone();
    this.modelRoot.worldToLocal(missed);
    return { hit: false, position: missed, uv, depth: Number.POSITIVE_INFINITY };
  }

  private toSample(
    hit: THREE.Intersection,
    faceNormal: THREE.Vector3,
    field: ProjectionField,
    uv: THREE.Vector2,
  ): RaySample {
    // Para separar la lamina se usa la normal interpolada del vertice, no la de
    // la cara: sobre malla de pocos poligonos evita el facetado de la impresion.
    const lift = this.scratchLift;
    const smooth = (hit as THREE.Intersection & { normal?: THREE.Vector3 }).normal;
    if (smooth) lift.copy(smooth).transformDirection(hit.object.matrixWorld).normalize();
    else lift.copy(faceNormal);

    const position = hit.point.clone().addScaledVector(lift, field.lift);
    this.modelRoot.worldToLocal(position);
    return { hit: true, position, uv, depth: hit.distance };
  }

  /**
   * Busca por biseccion el punto donde la superficie termina, entre una muestra
   * que golpea y otra que falla. Sin esto, el borde de la impresion queda
   * escalonado con el tamano de la celda de la rejilla.
   */
  private refineSilhouette(
    field: ProjectionField,
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    inside: RaySample,
    insideGu: number,
    insideGv: number,
    outsideGu: number,
    outsideGv: number,
  ): RaySample {
    let best = inside;
    let nearGu = insideGu;
    let nearGv = insideGv;
    let farGu = outsideGu;
    let farGv = outsideGv;

    for (let step = 0; step < this.wrapEdgeRefineSteps; step++) {
      const midGu = (nearGu + farGu) * 0.5;
      const midGv = (nearGv + farGv) * 0.5;
      const sample = this.castProjectionRay(field, targetMeshes, midGu, midGv);

      if (sample.hit) {
        best = sample;
        nearGu = midGu;
        nearGv = midGv;
      } else {
        farGu = midGu;
        farGv = midGv;
      }
    }

    return best;
  }

  /**
   * Rejilla de rayos sobre el campo y costura de la lamina.
   * Cada celda se recorta contra la silueta real y se descarta si sus vertices
   * caen en superficies distintas, para no coser un puente sobre el aire.
   */
  private buildProjectedSurface(
    field: ProjectionField,
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
    xSegments: number,
    ySegments: number,
  ): ProjectedSurface {
    const grid: RaySample[][] = [];
    let hasHit = false;
    let minGu = 1;
    let maxGu = 0;
    let minGv = 1;
    let maxGv = 0;

    for (let yIndex = 0; yIndex <= ySegments; yIndex++) {
      const gv = yIndex / ySegments;
      const row: RaySample[] = [];

      for (let xIndex = 0; xIndex <= xSegments; xIndex++) {
        const gu = xIndex / xSegments;
        const sample = this.castProjectionRay(field, targetMeshes, gu, gv);

        if (sample.hit) {
          hasHit = true;
          minGu = Math.min(minGu, gu);
          maxGu = Math.max(maxGu, gu);
          minGv = Math.min(minGv, gv);
          maxGv = Math.max(maxGv, gv);
        }

        row.push(sample);
      }

      grid.push(row);
    }

    const positions: number[] = [];
    const uvs: number[] = [];
    const corners: RaySample[] = new Array(4);
    const cornerGu = new Array<number>(4);
    const cornerGv = new Array<number>(4);
    const polygon: RaySample[] = [];

    for (let yIndex = 0; yIndex < ySegments; yIndex++) {
      const gv0 = yIndex / ySegments;
      const gv1 = (yIndex + 1) / ySegments;

      for (let xIndex = 0; xIndex < xSegments; xIndex++) {
        const gu0 = xIndex / xSegments;
        const gu1 = (xIndex + 1) / xSegments;

        // Contorno de la celda en orden de recorrido
        corners[0] = grid[yIndex][xIndex];
        corners[1] = grid[yIndex][xIndex + 1];
        corners[2] = grid[yIndex + 1][xIndex + 1];
        corners[3] = grid[yIndex + 1][xIndex];
        cornerGu[0] = gu0; cornerGv[0] = gv0;
        cornerGu[1] = gu1; cornerGv[1] = gv0;
        cornerGu[2] = gu1; cornerGv[2] = gv1;
        cornerGu[3] = gu0; cornerGv[3] = gv1;

        let hitCount = 0;
        for (let i = 0; i < 4; i++) if (corners[i].hit) hitCount++;
        if (hitCount === 0) continue;

        // Caso silla: dos esquinas opuestas. Cada una da su propio triangulo,
        // recorrer el contorno entero cruzaria el hueco del medio.
        if (hitCount === 2 && corners[0].hit === corners[2].hit) {
          for (const index of corners[0].hit ? [0, 2] : [1, 3]) {
            const previous = (index + 3) % 4;
            const next = (index + 1) % 4;
            polygon.length = 0;
            polygon.push(
              corners[index],
              this.refineSilhouette(
                field, targetMeshes, corners[index],
                cornerGu[index], cornerGv[index], cornerGu[next], cornerGv[next],
              ),
              this.refineSilhouette(
                field, targetMeshes, corners[index],
                cornerGu[index], cornerGv[index], cornerGu[previous], cornerGv[previous],
              ),
            );
            this.emitPolygon(polygon, field.depthTolerance, positions, uvs);
          }
          continue;
        }

        polygon.length = 0;
        for (let i = 0; i < 4; i++) {
          const next = (i + 1) % 4;
          if (corners[i].hit) polygon.push(corners[i]);
          if (corners[i].hit === corners[next].hit) continue;

          const insideIndex = corners[i].hit ? i : next;
          const outsideIndex = corners[i].hit ? next : i;
          polygon.push(
            this.refineSilhouette(
              field, targetMeshes, corners[insideIndex],
              cornerGu[insideIndex], cornerGv[insideIndex],
              cornerGu[outsideIndex], cornerGv[outsideIndex],
            ),
          );
        }

        this.emitPolygon(polygon, field.depthTolerance, positions, uvs);
      }
    }

    return { positions, uvs, hasHit, minGu, maxGu, minGv, maxGv };
  }

  private emitPolygon(
    polygon: RaySample[],
    depthTolerance: number,
    positions: number[],
    uvs: number[],
  ): void {
    if (polygon.length < 3) return;

    let minDepth = Number.POSITIVE_INFINITY;
    let maxDepth = Number.NEGATIVE_INFINITY;
    for (const vertex of polygon) {
      minDepth = Math.min(minDepth, vertex.depth);
      maxDepth = Math.max(maxDepth, vertex.depth);
    }
    // La celda toca dos superficies separadas: no se cose
    if (maxDepth - minDepth > depthTolerance) return;

    for (let i = 1; i < polygon.length - 1; i++) {
      this.pushTriangle(polygon[0], polygon[i], polygon[i + 1], positions, uvs);
    }
  }

  private pushTriangle(
    a: RaySample,
    b: RaySample,
    c: RaySample,
    positions: number[],
    uvs: number[],
  ): void {
    for (const vertex of [a, b, c]) {
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
      uvs.push(vertex.uv.x, vertex.uv.y);
    }
  }

  private toWrapGeometry(surface: ProjectedSurface): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(surface.positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(surface.uvs, 2));
    return geometry;
  }

  private getWrapLift(modelSize: THREE.Vector3): number {
    return Math.max(modelSize.x, modelSize.y, modelSize.z, 0.001) * this.wrapLiftRatio;
  }

  // ── Scene helpers ──────────────────────────────────────

  private getWrapTargets(): THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] {
    const meshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] = [];
    this.modelRoot.traverse((object) => {
      if (
        this.isMesh(object) &&
        object !== this.wrapMesh &&
        object !== this.bakedMesh &&
        object.userData['skipWrap'] !== true
      ) {
        meshes.push(object);
      }
    });
    return meshes;
  }

  private getLocalTargetBox(
    targetMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[],
  ): THREE.Box3 {
    const box = new THREE.Box3();
    const inverseRootMatrix = this.modelRoot.matrixWorld.clone().invert();
    const relativeMatrix = new THREE.Matrix4();

    for (const mesh of targetMeshes) {
      mesh.geometry.computeBoundingBox();
      if (!mesh.geometry.boundingBox) continue;
      relativeMatrix.multiplyMatrices(inverseRootMatrix, mesh.matrixWorld);
      box.union(mesh.geometry.boundingBox.clone().applyMatrix4(relativeMatrix));
    }

    return box.isEmpty() ? new THREE.Box3().setFromObject(this.modelRoot) : box;
  }

  private getImageAspect(): number {
    return this.wrapImage ? this.wrapImage.width / Math.max(this.wrapImage.height, 1) : 1;
  }

  private createBaseMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: '#f8faf8', metalness: 0, roughness: 0.34 });
  }

  private createShrinkWrapMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      map: this.ensureWrapTexture(),
      transparent: true,
      opacity: this.wrapOpacity,
      alphaTest: 0.03,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
  }

  private rotateGlobal(axis: Axis, radians: number): void {
    const vector =
      axis === 'x'
        ? new THREE.Vector3(1, 0, 0)
        : axis === 'y'
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1);
    const rotation = new THREE.Quaternion().setFromAxisAngle(vector, radians);
    this.modelRoot.quaternion.premultiply(rotation);
  }

  private clearModel(): void {
    this.wrapMesh = undefined;
    this.bakedMesh = undefined;
    this.bakedPositions = [];
    this.bakedUvs = [];
    this.stickerBaked.set(false);
    this.renderImageUrl.set(null);
    this.disposeFloatingPreview();
    for (const child of [...this.modelRoot.children]) {
      this.disposeObject(child);
      this.modelRoot.remove(child);
    }
    this.modelRoot.scale.setScalar(1);
    this.modelRoot.position.set(0, 0, 0);
  }

  private disposeWrapMesh(): void {
    if (!this.wrapMesh) return;
    this.wrapMesh.geometry.dispose();
    this.wrapMesh.material.dispose();
    this.modelRoot.remove(this.wrapMesh);
    this.wrapMesh = undefined;
  }

  private disposeBakedMesh(): void {
    if (!this.bakedMesh) return;
    this.bakedMesh.geometry.dispose();
    this.bakedMesh.material.dispose();
    this.modelRoot.remove(this.bakedMesh);
    this.bakedMesh = undefined;
  }

  private resetBake(): void {
    this.disposeBakedMesh();
    this.bakedPositions = [];
    this.bakedUvs = [];
    this.stickerBaked.set(false);
    this.renderImageUrl.set(null);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (!this.isMesh(child)) return;
      (child.geometry as BvhGeometry).disposeBoundsTree?.();
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) material.dispose();
    });
  }

  private isMesh(
    object: THREE.Object3D,
  ): object is THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> {
    return (object as THREE.Mesh).isMesh === true;
  }
}
