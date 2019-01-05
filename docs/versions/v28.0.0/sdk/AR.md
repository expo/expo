---
title: AR
---
> ARCore is not yet supported. This lib is iOS only right now.
Augmented Reality with ARKit for iOS 
This library is generally used with [expo-three](https://github.com/expo/expo-three) to generate a camera, and manage a 3D scene.

## API

> [Examples can be found here](https://github.com/expo/three-ar-test)

### Availability

#### `isAvailable()`

This will check the following condition:
* Device year is greater than 2014
* Device is not a simulator
* Device is iOS, and not Android


#### `getVersion()`

Get the version of ARKit running on the device. 
iOS 11 devices come with `1.0`, and the newly released iOS 11.3 comes with ARKit `1.5`;


### Listeners
All listeners will return an object capable of removing itself as such:
```js
const listener = AR.onFrameDidUpdate(() => {});
listener.remove()
```
Optionally you can also remove all listeners for a single event.
#### `removeAllListeners(eventType)`
```js
AR.removeAllListeners(AR.EventTypes.FrameDidUpdate)
```

#### `onFrameDidUpdate( () => {} )`

This will update everytime the ARSession has updated it's frame (has new data)


#### `onDidFailWithError( ({ error }) => {} )`

This will be called with the localized description of any Error thrown by ARKit


#### `onAnchorsDidUpdate( ({ anchors: Array, eventType: AnchorEventTypes }) => {} )`

Invoked when an anchor is found, updated, or removed. This is the primary way to get data from Detection Images, Planes, Faces, and general Anchors.

**Example**
```js
AR.onAnchorsDidUpdate(({anchors, eventType}) => {
  for (let anchor of anchors) {
    if (anchor.type === AR.AnchorTypes.Anchor) {
      const { identifier, transform } = anchor;

      if (eventType === AR.AnchorEventTypes.Add) {
        // Something added!  
      } else if (eventType === AR.AnchorEventTypes.Remove) {
        // Now it's changed
      } else if (eventType === AR.AnchorEventTypes.Update) {
        // Now it's gone...
      }
    }
  }
})
```

#### `onCameraDidChangeTrackingState( ({ trackingState: TrackingState, trackingStateReason: TrackingStateReason }) => {} )`

Called whenever the camera changes it's movement / tracking state. Useful for telling the user how to better hold and move the camera.

#### `onSessionWasInterrupted( () => {} )`

Simply this is called when the app backgerounds.

#### `onSessionInterruptionEnded( () => {} )`

This is called when the app returns to the foreground.


### [Hit Testing](https://developer.apple.com/documentation/arkit/arhittestresulttype)
Maybe the most powerful function, hit testing allows you to get real world info on a particular position in the screen.

#### `performHitTest(point, types: HitTestResultType)`

The `point` is a normalized value, meaning it is **between 0-1** this can be achieved by dividing the dimension position by size.
Ex: `{ x: x / width, y: y / height }` 

**Example**
```js
const normalizedPoint = { x, y };
const hitTestResultTypes =  AR.HitTestResultTypes.HorizontalPlane;
const { hitTest } = AR.performHitTest(normalizedPoint, hitTestResultTypes);
for (let hit of hitTest) {
  const { 
    worldTransform, 
    type, 
    localTransform, 
    distance, 
    anchor: { 
      identifier, 
      transform 
      }
    } = hit;
}

```

**Constants**

Possible `types` for specifying a hit-test search, or for the result of a hit-test search.

```js
HitTestResultTypes = {
  /**
   * Result type from intersecting the nearest feature point.
   */
  FeaturePoint: 'featurePoint',
  /**
   * Result type from intersecting a horizontal plane estimate, determined for the current frame.
   */
  HorizontalPlane: 'horizontalPlane',
  /**
   * Result type from intersecting a vertical plane estimate, determined for the current frame.
   */
  VerticalPlane: 'verticalPlane',
  /**
   * Result type from intersecting with an existing plane anchor.
   */
  ExistingPlane: 'existingPlane',
  /**
   * Result type from intersecting with an existing plane anchor, taking into account the plane’s extent.
   */
  ExistingPlaneUsingExtent: 'existingPlaneUsingExtent',
  /**
   * Result type from intersecting with an existing plane anchor, taking into account the plane’s geometry.
   */
  ExistingPlaneUsingGeometry: 'existingPlaneUsingGeometry',
};
```

### Detection Images
Given an image, ARKit will update you when it finds it in the real world.

> Make sure that all reference images are greater than 100 pixels and have a positive physical size in meters.

`setDetectionImagesAsync(images)`

**Example**
```js

const asset = Expo.Asset.fromModule(require('./image.png'))
await asset.downloadAsync();

await AR.setDetectionImagesAsync({
  myDopeImage: {
    /**
     * The local uri of the image, this can be obtained with Expo.Asset.fromModule()
     */
    uri: asset.localUri,
    /**
     * Name used to identify the Image Anchor returned in a `onAnchorsDidUpdate` listener.
     */
    name: 'myDopeImage',
    /**
     * Real-world size in meters. 
     */
    width: 0.1, 
  },
  ...
});

AR.onAnchorsDidUpdate(({anchors, eventType}) => {
  for (let anchor of anchors) {
    if (anchor.type === AR.AnchorTypes.Image) {
      const { identifier, image, transform } = anchor;

      if (eventType === AR.AnchorEventTypes.Add) {
        // Add some node
      } else if (eventType === AR.AnchorEventTypes.Remove) {
        // Remove that node
      } else if (eventType === AR.AnchorEventTypes.Update) {
        // Update whatever node
      }
    }
  }
})
```

### Raw Data
This synchronous function can return anchors, raw feature points, light estimation, and captured depth data.

#### `getCurrentFrame(attributes)`
You need to provide the attributes you want to recieve.

**Example**
```js
const {
  anchors, 
  rawFeaturePoints, 
  lightEstimation, 
  capturedDepthData,
  timestamp
  } = AR.getCurrentFrame({
  anchors: { 
    [AR.AnchorTypes.Face]: {
        blendShapes: true, 
        geometry: true
    }
  }, 
  rawFeaturePoints: true, 
  lightEstimation: true, 
  capturedDepthData: true
})

```

##### Getting face data
In order to be efficent you can specify which `blendShapes` you would like to have returned. 
You can do filter data like this:
```js
AR.getCurrentFrame({
    anchors: { 
        [AR.AnchorTypes.Face]: {
            blendShapes: [
                AR.BlendShapes.BrowDownL, 
                AR.BlendShapes.BrowDownR
            ], 
        }
    } 
})
```
This will return just the amount your left and right eyebrows are down.

##### Anchors
This can return the following Anchor Types:

* ARAnchor
* ARPlaneAnchor
* ARImageAnchor
* ARFaceAnchor

###### ARAnchor

```json
type: "ARAnchor", // AR.AnchorTypes.Anchor
transform: anchor.transform,
identifier: anchor.identifier
```

###### ARPlaneAnchor

```json
type: "ARPlaneAnchor", // AR.AnchorTypes.Plane
transform: anchor.transform,
identifier: anchor.identifier,
center: { 
    x: Float, 
    y: Float, 
    z: Float 
},
extent: {
    width: Float,
    length: Float
}
```

###### ARImageAnchor

```json
type: "ARImageAnchor", // AR.AnchorTypes.Image
transform: anchor.transform,
identifier: anchor.identifier,
image: { 
    name: anchor.referenceImage.name,
    size: { // Physical size in meters
        width: Float,
        height: Float,
    }
}
```

###### ARFaceAnchor

```json
type: "ARFaceAnchor", // AR.AnchorTypes.Face
transform: anchor.transform,
identifier: anchor.identifier,
isTracked: Bool,
geometry: {
    vertexCount: Int, // ARFaceAnchor.geometry.vertexCount
    textureCoordinateCount: Int, // ARFaceAnchor.geometry.textureCoordinateCount
    triangleCount: Int, // ARFaceAnchor.geometry.triangleCount
    vertices: [ { x: Float, y: Float, z: Float } ],
    textureCoordinates: [ { u: Float, v: Float } ],
    triangleIndices: [ Int ],
},
blendShapes: {
    browDown_L: Float, // AR.BlendShapes.BrowDownL
    browDown_R: Float, // AR.BlendShapes.BrowDownR
    browInnerUp: Float, // AR.BlendShapes.BrowInnerUp
    browOuterUp_L: Float, // AR.BlendShapes.BrowOuterUpL
    browOuterUp_R: Float, // AR.BlendShapes.BrowOuterUpR
    cheekPuff: Float, // AR.BlendShapes.CheekPuff
    cheekSquint_L: Float, // AR.BlendShapes.CheekSquintL
    cheekSquint_R: Float, // AR.BlendShapes.CheekSquintR
    eyeBlink_L: Float, // AR.BlendShapes.EyeBlinkL
    eyeBlink_R: Float, // AR.BlendShapes.EyeBlinkR
    eyeLookDown_L: Float, // AR.BlendShapes.EyeLookDownL
    eyeLookDown_R: Float, // AR.BlendShapes.EyeLookDownR
    eyeLookIn_L: Float, // AR.BlendShapes.EyeLookInL
    eyeLookIn_R: Float, // AR.BlendShapes.EyeLookInR
    eyeLookOut_L: Float, // AR.BlendShapes.EyeLookOutL
    eyeLookOut_R: Float, // AR.BlendShapes.EyeLookOutR
    eyeLookUp_L: Float, // AR.BlendShapes.EyeLookUpL
    eyeLookUp_R: Float, // AR.BlendShapes.EyeLookUpR
    eyeSquint_L: Float, // AR.BlendShapes.EyeSquintL
    eyeSquint_R: Float, // AR.BlendShapes.EyeSquintR
    eyeWide_L: Float, // AR.BlendShapes.EyeWideL
    eyeWide_R: Float, // AR.BlendShapes.EyeWideR
    jawForward: Float, // AR.BlendShapes.JawForward
    jawLeft: Float, // AR.BlendShapes.JawLeft
    jawOpen: Float, // AR.BlendShapes.JawOpen
    jawRight: Float, // AR.BlendShapes.JawRight
    mouthClose: Float, // AR.BlendShapes.MouthClose
    mouthDimple_L: Float, // AR.BlendShapes.MouthDimpleL
    mouthDimple_R: Float, // AR.BlendShapes.MouthDimpleR
    mouthFrown_L: Float, // AR.BlendShapes.MouthFrownL
    mouthFrown_R: Float, // AR.BlendShapes.MouthFrownR
    mouthFunnel: Float, // AR.BlendShapes.MouthFunnel
    mouthLeft: Float, // AR.BlendShapes.MouthLeft
    mouthLowerDown_L: Float, // AR.BlendShapes.MouthLowerDownL
    mouthLowerDown_R: Float, // AR.BlendShapes.MouthLowerDownR
    mouthPress_L: Float, // AR.BlendShapes.MouthPressL
    mouthPress_R: Float, // AR.BlendShapes.MouthPressR
    mouthPucker: Float, // AR.BlendShapes.MouthPucker
    mouthRight: Float, // AR.BlendShapes.MouthRight
    mouthRollLower: Float, // AR.BlendShapes.MouthRollLower
    mouthRollUpper: Float, // AR.BlendShapes.MouthRollUpper
    mouthShrugLower: Float, // AR.BlendShapes.MouthShrugLower
    mouthShrugUpper: Float, // AR.BlendShapes.MouthShrugUpper
    mouthSmile_L: Float, // AR.BlendShapes.MouthSmileL
    mouthSmile_R: Float, // AR.BlendShapes.MouthSmileR
    mouthStretch_L: Float, // AR.BlendShapes.MouthStretchL
    mouthStretch_R: Float, // AR.BlendShapes.MouthStretchR
    mouthUpperUp_L: Float, // AR.BlendShapes.MouthUpperUpL
    mouthUpperUp_R: Float, // AR.BlendShapes.MouthUpperUpR
    noseSneer_L: Float, // AR.BlendShapes.NoseSneerL
    noseSneer_R: Float, // AR.BlendShapes.NoseSneerR
}
```

### Camera Data
Matrix data can be used in three.js (with [expo-three](https://github.com/expo/expo-three#expothreecreatearcamera)) to generate a 3D camera.
#### `getARMatrices(near: number, far: number)`
>`getARMatrices(arsession, width, height, near, far)` is now `getARMatrices(near, far)`

### Build up / Tear down

Given reference to a `GLView` and a `ARTrackingConfiguration`, this will create an `ARSession` associated with the `GLContext`
`startARSessionAsync(view, trackingConfiguration)`

> `startARSessionAsync` is now `startAsync`

When invoked, this method will tear-down the `ARSession`, and `WebGLTexture` used for the camera stream. This is an end-of-lifecycle method.
`stopAsync()`

>`stopARSessionAsync()` is now `stopAsync` 

### Running State

Used to reset the anchors and current data in the `ARSession`.
`reset()`

Used to pause the `ARSession`.
`pause()`

Used to resume the `ARSession` after pausing it.
`resume()`


### [Configuration](https://developer.apple.com/documentation/arkit/arconfiguration)

Check availability.
`isConfigurationAvailable(configuration: TrackingConfiguration): Bool`

A Configuration defines how ARKit constructs a scene based on real-world device motion.
`setConfigurationAsync(configuration: TrackingConfiguration)`

Alternatively you could also use:
* `isFrontCameraAvailable()`
* `isRearCameraAvailable()`

```js
TrackingConfigurations = {
  /**
   * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's position and orientation and allow plane detection and hit testing.
   */
  world: 'ARWorldTrackingConfiguration',
  /**
   * Provides basic AR experiences that use the rear-facing camera and track only a device's orientation.
   */
  orientation: 'AROrientationTrackingConfiguration',
   /**
   * Provides AR experiences that use the front-facing camera and track the movement and expressions of the user's face.
   */
  face: 'ARFaceTrackingConfiguration',
};
```

### [Plane Detection](https://developer.apple.com/documentation/arkit/arplanedetection?language)
Used to enable or disable plane detection (`ARPlaneAnchor`s will be able to return in `onAnchorsDidUpdate`).
> As of iOS 11.3 (ARKit 1.5) you can now enable vertical plane detection.
**Default: AR.PlaneDetectionTypes.None**
**GET:** `planeDetection(): PlaneDetection`
**SET:** `setPlaneDetection(planeDetection: PlaneDetection)`

**Constants**

Options for whether and how ARKit detects flat surfaces in captured images.

```js
PlaneDetectionTypes = {
  /**
   * No plane detection is run.
   */
  None: 'none',
  /**
   * Plane detection determines horizontal planes in the scene.
   */
  Horizontal: 'horizontal',
  /**
   * Plane detection determines vertical planes in the scene.
   */
  Vertical: 'vertical',
};
```

### [World Origin]()
The center of the 3D space used by ARKit
`setWorldOriginAsync(matrix4x4)`

> A Matrix 4x4 is an array of 16 doubles

```js
`setWorldOriginAsync([1,1,1,1,0,0,0,0,0,0,0,0])`
```

### [Light Estimation](https://developer.apple.com/documentation/arkit/arlightestimate?language=objc)
Estimated scene lighting information associated with a captured video frame in an AR session.
**Default: true**
**SET:** `setLightEstimationEnabled(value: Boolean)`
**GET:** `getLightEstimationEnabled(): Boolean`

Light estimation can be retrieved through `getCurrentFrame` with the `lightEstimation` key added.

### [Provides Audio Data](https://developer.apple.com/documentation/arkit/arconfiguration/2923559-providesaudiodata?language=objc)
A Boolean value that specifies whether to capture audio during the AR session. 
You cannot currently access the audio data as it is useless.
**Default: false**
**SET:** `setProvidesAudioData(value: Boolean)`
**GET:** `getProvidesAudioData(): Boolean`

### [Auto Focus](https://developer.apple.com/documentation/arkit/arorientationtrackingconfiguration/2942263-autofocusenabled?language=objc)
> iOS 11.3+
A Boolean value that determines whether the device camera uses fixed focus or autofocus behavior.
**Default: true**
**SET:** `setAutoFocusEnabled(value: Boolean)`
**GET:** `getAutoFocusEnabled(): Boolean`

### [World Alignment](https://developer.apple.com/documentation/arkit/arworldalignment?language=objc)
Options for how ARKit constructs a scene coordinate system based on real-world device motion.
**Default: AR.WorldAlignmentTypes.Gravity**
**SET:** `setWorldAlignment(worldAlignment: WorldAlignment)`
**GET:** `getWorldAlignment(): WorldAlignment`

```js
const WorldAlignmentTypes = {
  Gravity: 'gravity',
  GravityAndHeading: 'gravityAndHeading',
  AlignmentCamera: 'alignmentCamera',
};
```

### Camera Texture
The internal ID used to render the camera texture.
**GET:** `getCameraTexture(): Number`


### [Supported Video Formats](https://developer.apple.com/documentation/arkit/arconfiguration/2942261-supportedvideoformats?language=objc)
> iOS 11.3+
The set of video capture formats available on the current device. The video format cannot be set yet. 
**Default: The first element returned is the default value**
**GET:** `AR.getSupportedVideoFormats(configuration: TrackingConfiguration): Array`

```js
{
    imageResolution: {
        width: 1920,
        height: 1080
    },
    framesPerSecond: 60 
}
```
