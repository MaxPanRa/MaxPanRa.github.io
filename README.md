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

## Wrap modes

- `Frontal`: casts rays from the preview front, useful for decals and stickers on the visible side.
- `Rodear`: casts rays radially from a cylinder around the model, so the print continues onto surfaces that are not currently visible. This works best on cylindrical/convex objects. For handled cups or complex meshes, separate the printable body from handles/interiors or mark non-printable meshes so the rays do not hit them first.

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
