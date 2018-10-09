[![NPM](https://nodei.co/npm/expo-three.png)](https://nodei.co/npm/expo-three/)

# expo-three

Tools for using three.js to build native 3D experiences 💙

### Installation

```bash
yarn add three expo-three
```

### Usage

Import the library into your JavaScript file:

```js
import ExpoTHREE from 'expo-three';
```

Get a global instance of `three.js` from `expo-three`:

```js
import { THREE } from 'expo-three';
```

You can also import AR tools:

```js
// This alias is useful cuz Expo.AR could collide.
import { AR as ThreeAR } from 'expo-three';
```

> `ExpoTHREE.AR` is not the same as `Expo.AR`. Think of `Expo.AR` as a data provider for `ExpoTHREE.AR` to visualize.

## Creating a Renderer

### `ExpoTHREE.Renderer({ gl: WebGLRenderingContext, width: number, height: number, pixelRatio: number, ...extras })`

Given a `gl` from an
[`Expo.GLView`](https://docs.expo.io/versions/latest/sdk/gl-view.html), return a
[`THREE.WebGLRenderer`](https://threejs.org/docs/#api/renderers/WebGLRenderer)
that draws into it.

```js
const renderer = new ExpoTHREE.Renderer(props);
or;
/// A legacy alias for the extended renderer
const renderer = ExpoTHREE.createRenderer(props);
// Now just code some three.js stuff and add it to this! :D
```

### `ExpoTHREE.loadAsync()`

A function that will asynchronously load files based on their extension.

> **Notice**: Remember to update your `app.json` to bundle obscure file types!

```json
"packagerOpts": {
  "assetExts": [
    "dae",
    "obj",
    "mtl"
  ]
}
```

#### Props

| Property      |           Type            | Description                                                      |
| ------------- | :-----------------------: | ---------------------------------------------------------------- |
| resource      |       PossibleAsset       | The asset that will be parsed asynchornously                     |
| onProgress    |       (xhr) => void       | A function that is called with an xhr event                      |
| assetProvider | () => Promise<Expo.Asset> | A function that is called whenever an unknown asset is requested |

##### PossibleAsset Format

export type PossibleAsset = Expo.Asset | number | string | AssetFormat;

```js
type PossibleAsset = number | string | Expo.Asset;
```

- `number`: Static file reference `require('./model.*')`
- `Expo.Asset`: [Expo.Asset](https://docs.expo.io/versions/latest/sdk/asset.html)
- `string`: A uri path to an asset

#### Returns

This returns many different things, based on the input file.
For a more predictable return value you should use one of the more specific model loaders.

#### Example

A list of supported formats can be found [here](/examples/loader)

```js
const texture = await ExpoTHREE.loadAsync('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png');
```

## Loaders

> Don't forget to add your extensions to `expo.packagerOpts.assetExts` in the `app.json`

### loadAsync(assetReference, onProgress, onAssetRequested)

A universal loader that can be used to load images, models, scenes, and animations.
Optionally more specific loaders are provided with less complexity.

```js
// A THREE.Texture from a static resource.
const texture = await ExpoTHREE.loadAsync(require('./icon.png'));
const obj = await ExpoTHREE.loadAsync(
  [
    require('./cartman.obj'),
    require('./cartman.mtl')
  ],
  null,
  (imageName) => resources[imageName]
);
const { scene } = await ExpoTHREE.loadAsync(
  resources['./kenny.dae'],
  onProgress,
  resources
);
```

### loadObjAsync({ asset, mtlAsset, materials, onAssetRequested, onMtlAssetRequested })

#### Props

- `asset`: a `obj` model reference that will be evaluated using `AssetUtils.uriAsync`
- `mtlAsset`: an optional prop that will be loaded using `loadMtlAsync()`
- `onAssetRequested`: A callback that is used to evaluate urls found within the `asset` and optionally the `mtlAsset`. You can also just pass in a dictionary of key values if you know the assets required ahead of time.
- `materials`: Optionally you can provide an array of materials returned from `loadMtlAsync()`
- `onMtlAssetRequested`: If provided this will be used to request assets in `loadMtlAsync()`

This function is used as a more direct method to loading a `.obj` model.
You should use this function to debug when your model has a corrupted format.

```js
const mesh = await loadObjAsync({ asset: 'https://www.members.com/chef.obj' })
```

See: [MTL Loader Demo](/example/screens/Loaders/MtlLoaderExample.js)

### loadTextureAsync({ asset })

#### Props

- `asset`: an `Expo.Asset` that could be evaluated using `AssetUtils.resolveAsync` if `localUri` is missing or the asset hasn't been downloaded yet.

This function is used as a more direct method to loading an image into a texture.
You should use this function to debug when your image is using an odd extension like `.bmp`.

```js
const texture = await loadTextureAsync({ asset: require('./image.png') })
```

### loadMtlAsync({ asset, onAssetRequested })

#### Props

- `asset`: a `mtl` material reference that will be evaluated using `AssetUtils.uriAsync`
- `onAssetRequested`: A callback that is used to evaluate urls found within the `asset`, optionally you can just pass in a dictionary of key values if you know the assets required ahead of time.

```js
const materials = await loadMtlAsync({
  asset: require('chef.mtl'),
  onAssetRequested:
  modelAssets
})
```

See: [MTL Loader Demo](/example/screens/Loaders/MtlLoaderExample.js)

### loadDaeAsync({ asset, onAssetRequested, onProgress })

#### Props

- `asset`: a reference to a `dae` scene that will be evaluated using `AssetUtils.uriAsync`
- `onAssetRequested`: A callback that is used to evaluate urls found within the `asset`, optionally you can just pass in a dictionary of key values if you know the assets required ahead of time.
- `onProgress`: An experimental callback used to track loading progress.

```js
const { scene } = await loadDaeAsync({
  asset: require('chef.dae'),
  onAssetRequested: modelAssets,
  onProgress: () => {}
})
```

See: [Collada Loader Demo](/example/screens/Loaders/DaeLoaderExample.js)

## AR

Tools and utilites for working with ARKit in Expo.

Here is an example of a basic AR enabled scene. [Also in snack form!](https://snack.expo.io/@bacon/basic-ar-scene)

```js
import { AR } from 'expo';
import ExpoTHREE, { AR as ThreeAR, THREE } from 'expo-three';
import React from 'react';
import { View as GraphicsView } from 'expo-graphics';

export default class App extends React.Component {
  render() {
    // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
    return (
      <GraphicsView
        style={{ flex: 2 }}
        onContextCreate={this.onContextCreate}
        onRender={this.onRender}
        onResize={this.onResize}
        isArEnabled
        isArRunningStateEnabled
        isArCameraStateEnabled
        arTrackingConfiguration={AR.TrackingConfigurations.World}
      />
    );
  }

  onContextCreate = ({ gl, scale: pixelRatio, width, height }) => {
    AR.setPlaneDetection(AR.PlaneDetectionTypes.Horizontal);

    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });

    this.scene = new THREE.Scene();
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);
    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);
  };

  onResize = ({ x, y, scale, width, height }) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  onRender = () => {
    this.renderer.render(this.scene, this.camera);
  };
}
```

#### Enabling AR:

- `Expo.GLView`: call `Expo.AR.startAsync(gl)` after `Expo.GLView.onContextCreate` has been called.
- `expo-graphics`: you need to add the `isArEnabled` & `arTrackingConfiguration` props.

### `new ExpoTHREE.AR.BackgroundTexture(renderer: WebGLRenderingContext)`

extends a [`THREE.Texture`](https://threejs.org/docs/#api/textures/Texture) that
reflects the live video feed of the AR session. Usually this is set as the
`.background` property of a
[`THREE.Scene`](https://threejs.org/docs/#api/scenes/Scene) to render the video
feed behind the scene's objects.

```js
// viewport width/height & zNear/zFar
scene.background = new ExpoTHREE.AR.BackgroundTexture(renderer);
```

See: [Basic Demo](/example/screens/AR/Basic.js)

### `new ExpoTHREE.AR.Camera(width: number, height: number, zNear: number, zFar: number)`

extends a [`THREE.PerspectiveCamera`](https://threejs.org/docs/#api/cameras/PerspectiveCamera)
that automatically updates its view and projection matrices to reflect the AR
session camera. `width, height` specify the dimensions of the target viewport to
render to and `near, far` specify the near and far clipping distances
respectively. The `THREE.PerspectiveCamera` returned has its `updateMatrixWorld`
and `updateProjectionMatrix` methods overriden to update to the AR session's
state automatically.
`THREE.PerspectiveCamera` that updates it's transform based on the device's orientation.

```js
// viewport width/height & zNear/zFar
const camera = new ExpoTHREE.AR.Camera(width, height, 0.01, 1000);
```

See: [Basic Demo](/example/screens/AR/Basic.js)

### `new ExpoTHREE.AR.Light()`

`THREE.PointLight` that will update it's color and intensity based on ARKit's assumption of the room lighting.

```js
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ReinhardToneMapping;

const arPointLight = new ExpoTHREE.AR.Light();
arPointLight.position.y = 2;
scene.add(arPointLight);

// You should also add a Directional for shadows
const shadowLight = new THREE.DirectionalLight();
scene.add(shadowLight);
// If you would like to move the light (you would) then you will need to add the lights `target` to the scene.
// The shadowLight.position adjusts one side of the light vector, and the target.position represents the other.
scene.add(shadowLight.target);

...
// Call this every frame:
arPointLight.update()
```

See: [Model Demo](/example/screens/AR/Model.js)

### `new ExpoTHREE.AR.MagneticObject()`

A `THREE.Mesh` that sticks to surfaces.
Use this as a parent to models that you want to attach to surfaces.

```js
const magneticObject = new ExpoTHREE.AR.MagneticObject();
magneticObject.maintainScale = false; // This will scale the mesh up/down to preserve it's size regardless of distance.
magneticObject.maintainRotation = true; // When true the mesh will orient itself to face the camera.

// screenCenter is a normalized value = { 0.5, 0.5 }
const screenCenter = new THREE.Vector2(0.5, 0.5);
...

// Call this every frame to update the position.
magneticObject.update(camera, screenCenter);
```

See: [Model Demo](/example/screens/AR/Model.js)

### `new ExpoTHREE.AR.ShadowFloor()`

A transparent plane that extends `THREE.Mesh` and receives shadows from other meshes.
This is used to render shadows on real world surfaces.

```js
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.shadowMap.enabled = true;
const shadowFloor = new ExpoTHREE.AR.ShadowFloor({ width: 1, height: 1, opacity: 0.6 }); // The opacity of the shadow
```

See: [Model Demo](/example/screens/AR/Model.js)

### `new ExpoTHREE.AR.CubeTexture()`

Used to load in a texture cube or skybox.

- `assetForDirection`: This function will be called for each of the 6
  directions.
  - `({ direction })`: A direction string will be passed back looking for the
    corresponding image. You can send back: `static resource`, `localUri`,
    `Expo.Asset`, `remote image url`
- `directions`: The order that image will be requested in. The default value is:
  `['px', 'nx', 'py', 'ny', 'pz', 'nz']`

Example:

```js
const skybox = {
	nx: require('./nx.jpg'),
	ny: require('./ny.jpg'),
	nz: require('./nz.jpg'),
	px: require('./px.jpg'),
	py: require('./py.jpg'),
	pz: require('./pz.jpg')
}
const cubeTexture = new CubeTexture()
await cubeTexture.loadAsync({assetForDirection: ({ direction }) => skybox[direction]})
scene.background = cubeTexture
```

### `new ExpoTHREE.AR.Points()`

A utility object that renders all the raw feature points.

```js
const points = new ExpoTHREE.AR.Points();
// Then call this each frame...
points.update();
```

See: [Points Demo](/example/screens/AR/Points.js)

### `new ExpoTHREE.AR.Planes()`

A utility object that renders all the ARPlaneAnchors

```js
const planes = new ExpoTHREE.AR.Planes();
// Then call this each frame...
planes.update();
```

See: [Planes Demo](/example/screens/AR/Planes.js)

## AR Functions

Three.js calculation utilites for working in ARKit.
Most of these functions are used for calculating the surfaces.
You should see if `ExpoTHREE.AR.MagneticObject()` has what you need before digging into these.
[You can also check out this example provided by Apple](https://developer.apple.com/sample-code/wwdc/2017/PlacingObjects.zip)

### hitTestWithFeatures(camera: THREE.Camera, point: THREE.Vector2, coneOpeningAngleInDegrees: number, minDistance: number, maxDistance: number, rawFeaturePoints: Array<any>)

#### Props

- camera: THREE.Camera
- point: THREE.Vector2
- coneOpeningAngleInDegrees: number
- minDistance: number
- maxDistance: number
- rawFeaturePoints: Array<any>

### hitTestWithPoint(camera: THREE.Camera, point: THREE.Vector2)

#### Props

- camera: THREE.Camera
- point: THREE.Vector2

### unprojectPoint(camera: THREE.Camera, point: THREE.Vector2)

#### Props

- camera: THREE.Camera
- point: THREE.Vector2

### hitTestRayFromScreenPos(camera: THREE.Camera, point: THREE.Vector2)

#### Props

- camera: THREE.Camera
- point: THREE.Vector2

### hitTestFromOrigin(origin: THREE.Vector3, direction: THREE.Vector3, rawFeaturePoints: ?Array<any>)

#### Props

- origin: THREE.Vector3
- direction: THREE.Vector3
- rawFeaturePoints: ?Array<any>

### hitTestWithInfiniteHorizontalPlane(camera: THREE.Camera, point: Point, pointOnPlane: THREE.Vector3)

#### Props

- camera: THREE.Camera
- point: THREE.Vector2
- pointOnPlane: THREE.Vector3

### rayIntersectionWithHorizontalPlane(rayOrigin: THREE.Vector3, direction: THREE.Vector3, planeY: number)

#### Props

- rayOrigin: THREE.Vector3
- direction: THREE.Vector3
- planeY: number

### convertTransformArray(transform: Array<number>): THREE.Matrix4

#### Props

- transform: Array<number>

### positionFromTransform(transform: THREE.Matrix4): THREE.Vector3

#### Props

- transform: THREE.Matrix4

### worldPositionFromScreenPosition(camera: THREE.Camera, position: THREE.Vector2, objectPos: THREE.Vector3, infinitePlane = false, dragOnInfinitePlanesEnabled = false, rawFeaturePoints = null): { worldPosition: THREE.Vector3, planeAnchor: ARPlaneAnchor, hitAPlane: boolean }

#### Props

- camera: THREE.Camera
- position: THREE.Vector2
- objectPos: THREE.Vector3
- infinitePlane = false
- dragOnInfinitePlanesEnabled = false
- rawFeaturePoints = null

### positionFromAnchor(anchor: ARAnchor): THREE.Vector3

#### Props

- anchor: { worldTransform: Matrix4 }

### improviseHitTest(point, camera: THREE.Camera): ?THREE.Vector3

#### Props

- point: THREE.Vector2
- camera: THREE.Camera

---

## `ExpoTHREE.utils`

### `ExpoTHREE.utils.alignMesh()`

#### Props

```js
type Axis = {
  x?: number,
  y?: number,
  z?: number,
};
```

| Property |    Type     | Description                       |
| -------- | :---------: | --------------------------------- |
| mesh     | &THREE.Mesh | The mesh that will be manipulated |
| axis     |    ?Axis    | Set the relative center axis      |

#### Example

```js
ExpoTHREE.utils.alignMesh(mesh, { x: 0.0, y: 0.5 });
```

---

### `ExpoTHREE.utils.scaleLongestSideToSize()`

#### Props

| Property |    Type     | Description                                                  |
| -------- | :---------: | ------------------------------------------------------------ |
| mesh     | &THREE.Mesh | The mesh that will be manipulated                            |
| size     |   number    | The size that the longest side of the mesh will be scaled to |

#### Example

```js
ExpoTHREE.utils.scaleLongestSideToSize(mesh, 3.2);
```

---

### `ExpoTHREE.utils.computeMeshNormals()`

Used for smoothing imported geometry, specifically when imported from `.obj` models.

#### Props

| Property |    Type     | Description                                       |
| -------- | :---------: | ------------------------------------------------- |
| mesh     | &THREE.Mesh | The mutable (inout) mesh that will be manipulated |

#### Example

````js
ExpoTHREE.utils.computeMeshNormals(mesh);
```

---

## THREE Extensions

### `suppressExpoWarnings`

A function that suppresses EXGL compatibility warnings and logs them instead.
You will need to import the `ExpoTHREE.THREE` global instance to use this. By
default this function will be activated on import.

* `shouldSuppress`: boolean

```js
import { THREE } from 'expo-three';
THREE.suppressExpoWarnings();
````

---

## Links

Somewhat out of date

- [Loading Text](https://github.com/EvanBacon/expo-three-text)
- [ARKit Tutorial](https://blog.expo.io/introducing-expo-ar-mobile-augmented-reality-with-javascript-powered-by-arkit-b0d5a02ff23)
- [ARKit Example](https://snack.expo.io/@bacon/arkit-example)

- [three.js docs](https://threejs.org/docs/)

- [Random Demos](https://github.com/EvanBacon/expo-three-demo)
- [Game: Expo Sunset Cyberspace](https://github.com/EvanBacon/Sunset-Cyberspace)
- [Game: Crossy Road](https://github.com/EvanBacon/Expo-Crossy-Road)
- [Game: Nitro Roll](https://github.com/EvanBacon/Expo-Nitro-Roll)
- [Game: Pillar Valley](https://github.com/EvanBacon/Expo-Pillar-Valley)
- [Voxel Terrain](https://github.com/EvanBacon/Expo-Voxel)
