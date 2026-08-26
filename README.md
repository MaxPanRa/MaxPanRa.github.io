# WrappingPreview

Angular component for previewing a printable wrap on a 3D object with Three.js.

## What is included

- `ProductWrapperComponent` in `src/app/product-wrapper`
- GLB, OBJ and STL loading from `/assets/models`
- Horizontal drag rotation on the global Y axis
- Temporary 90 degree global-axis rotation buttons for X/Y/Z testing
- Image upload from the device and ray-based shrinkwrap projection over the model surface
- Two projection modes: front-facing shrinkwrap for stickers and radial wrap for around-the-object prints
- `three-mesh-bvh` acceleration for raycasting heavier STL/OBJ meshes
- Responsive layout for mobile WebViews and desktop browsers

## Interface

Industrial control panel: a graphite chassis around the viewport, so the 3D object is the brightest thing on screen.

- **No gradients.** Depth comes from flat value steps between surfaces (`--ink-950` to `--ink-600`) and 1px rules (`--rule`, `--rule-hi`, `--rule-top`). Tokens live in `src/styles.scss` (`:root`); the component reads them, it never hardcodes colors.
- **One signal color** (`--signal`, safety yellow) for the primary action, the active control, the progress bar and focus rings. `--warn` and `--ok` appear only for real machine state.
- **One radius** (`--r: 2px`) on every control, panel and button. No pills, no floating glass shells.
- **Type:** `Archivo` for the interface, `JetBrains Mono` with tabular figures for every readout (mode, scale, hex, status).
- **Chassis layout:** header (52px) / viewport + rail (348px) / status strip (30px), separated by rules that are real elements (`.js-rule`), not borders, so the boot animation can draw them.
- **Motion (GSAP 3):** boot timeline draws the chassis rules and staggers the modules in; the projection thumb travels to the selected mode; the status readout flips on every state change; the framing brackets snap when a bake locks; the render dialog opens and closes on a timeline. Every tween lives in a `gsap.context` scoped to the host and is reverted in `ngOnDestroy`; nothing runs under `prefers-reduced-motion` (the host gets `.no-motion`). All tweens run outside the Angular zone.
- **Scene background** is a flat color (`#0b0d0e`); the technical grid and the edge ruler are CSS layers drawn over the canvas, so they stay aspect-correct.
- **Layout:** side rail at ≥1081px, two-column rail below the viewport at ≤1080px, single column at ≤720px.

## Wrap modes

- `Frontal`: casts rays from the preview front, useful for decals and stickers on the visible side.
- `Rodear`: casts rays radially from a cylinder around the model, so the print continues onto surfaces that are not currently visible. This works best on cylindrical/convex objects. For handled cups or complex meshes, separate the printable body from handles/interiors or mark non-printable meshes so the rays do not hit them first.

## Projection quality

The wrap is pure vertex + ray work: a grid of rays is cast against the mesh and the hits become the vertices of the printed sheet. Front, radial and bake-strip modes differ only in how the ray is built (`ProjectionField`); sampling, filtering and stitching are shared in `buildProjectedSurface()`.

- **Texture aspect.** The wrap canvas takes the image aspect ratio and the image fills it. The projected sheet is built with that same ratio, so `UV 0..1` is exactly the image. (Previously the image was letterboxed into a square canvas, which stretched every non-square image by its own aspect factor.)
- **Back faces and grazing hits.** A hit is used only if the ray meets the face at more than ~79 degrees off tangent (`wrapGrazingLimit`). Below that the image would stretch more than 5x, which is the smear that used to appear at the edge of the object. Meshes with inverted winding fall back to the same test on the absolute angle.
- **Silhouette refinement.** Cells that straddle the boundary are clipped against the real surface edge, found by bisection along the cell edges (`wrapEdgeRefineSteps`), instead of dropping the whole cell. The print ends on the object's outline rather than on a staircase of grid cells.
- **Depth discontinuity.** A cell whose vertices land on surfaces further apart than `wrapDepthTolerance` cell widths is not stitched, so the sheet does not bridge across a gap (mug body to handle, box face to flap).
- **Lift and shading.** The sheet is pushed off the surface by a fraction of the model size (`wrapLiftRatio`) along the interpolated vertex normal, not the face normal, so low-poly meshes do not show faceting.
- **Filtering.** The wrap texture uses mipmaps plus max anisotropy, which is what keeps the print sharp where the surface turns away from the camera.

A full front reprojection (89 x 89 rays plus edge refinement) measures 9-18 ms on the bundled models, so it runs inline while dragging the size slider.

## Procedural models

The selector ships five code-built products, chosen to cover the shapes a wrap has to survive:

| Label | Builder | Geometry |
| --- | --- | --- |
| Taza | `createStudioMugModel` | Lathe profile with real wall thickness, rolled rim and chamfered foot; handle is a flattened tube along a curve, embedded into the wall |
| Balón | `createSportBallModel` | Level-6 icosphere, indexed, with the 30 icosahedron edges pressed in as seams and each panel bulged |
| Caja | `createCartonModel` | `RoundedBoxGeometry` (real edge radius, not a chamfer fake) plus a tape strip |
| Bidón | `createJerryCanModel` | Lofted superellipse rings: rounded-rectangle body, off-center neck, molded handle |
| Pouch | `createPouchModel` | Lofted rings from a gusseted base through the belly to a flattened top seal, with a slight twist |

Rules followed while building them (from the `img2threejs` skill's geometry patterns): real cross-section per part instead of extruded slabs, real edge radii instead of all-sharp or all-smooth, adjacent parts overlapping at the seam instead of merely touching, and one named mesh per part. Non-printable parts (cap, tape, mug handle) carry `skipWrap` so projection rays ignore them. Each model was verified from three camera angles, since a flat form only gives itself away when it rotates.

Everything else is listed in `hiddenModelOptions`: the earlier procedural models (`procedural`, `procedural-box`, `procedural-mug`, `procedural-soccer`) and the file-based ones (`/assets/models/1.stl` through `4.glb`). They are out of the selector but still load by url, and their labels still resolve in the header readout. The bottle remains the fallback when an asset fails to load.

## Model assets

Place models in `public/assets/models`. The selector is already wired to:

- `public/assets/models/bottle.glb`
- `public/assets/models/flask.obj`
- `public/assets/models/smallEarCup.stl`

If the selected file does not exist, the component uses a procedural bottle so the wrap flow can still be tested.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
