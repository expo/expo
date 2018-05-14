
# expo-face-detector

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXFaceDetector'`

and run `pod install`.

### iOS (no Cocoapods)

1.  In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2.  Go to `node_modules` ➜ `expo-face-detector` and add `EXFaceDetector.xcodeproj`
3.  In XCode, in the project navigator, select your project. Add `libEXFaceDetector.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4.  Run your project (`Cmd+R`).

### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-face-detector'
    project(':expo-face-detector').projectDir = new File(rootProject.projectDir, '../node_modules/expo-face-detector/android')

    include ':expo-face-detector-interface'
    project(':expo-face-detector-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-face-detector-interface/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-face-detector')
    compile project(':expo-face-detector-interface')
    ```

## Introduction

`FaceDetector` lets you use the power of [Google Mobile Vision](https://developers.google.com/vision/face-detection-concepts) framework to detect faces on images.

## Known issues

- Android does not recognize faces that aren't aligned with the interface (top of the interface matches top of the head).

## Methods

### `detectFaces`

Detect faces on a picture.

#### Arguments

- **uri (_string_)** -- `file://` URI to the image.
- **options? (_object_)** -- A map of options:
  - **mode? (_FaceDetector.Constants.Mode_)** -- Whether to detect faces in fast or accurate mode. Use `FaceDetector.Constants.Mode.{fast, accurate}`.
  - **detectLandmarks? (_FaceDetector.Constants.Landmarks_)** -- Whether to detect and return landmarks positions on the face (ears, eyes, mouth, cheeks, nose). Use `FaceDetector.Constants.Landmarks.{all, none}`.
  - **runClassifications? (_FaceDetector.Constants.Classifications_)** -- Whether to run additional classifications on detected faces (smiling probability, open eye probabilities). Use `FaceDetector.Constants.Classifications.{all, none}`.

#### Returns

Returns a Promise that resolves to an object: `{ faces, image }` where `faces` is an array of the detected faces and `image` is an object containing `uri: string` of the image, `width: number` of the image in pixels, `height: number` of the image in pixels and `orientation: number` of the image (value conforms to the EXIF orientation tag standard).

#### Example

```javascript
import { FaceDetector } from 'expo-face-detector';

// ...
detectFaces = async (imageUri) => {
  const options = { mode: FaceDetector.Constants.Mode.fast };
  return await FaceDetector.detectFaces(imageUri, options);
};
// ...
```

##### Detected face schema

A detected face is an object containing at most following fields:

- **bounds (_object_)** -- an object containing:
  - **origin (`{ x: number, y: number }`)** -- position of the top left corner of a square containing the face in image coordinates,
  - **size (`{ width: number, height: number }`)** -- size of the square containing the face in image coordinates,
- **rollAngle (_number_)** -- roll angle of the face (bank),
- **yawAngle (_number_)** -- yaw angle of the face (heading, turning head left or right),
- **smilingProbability (_number_)** -- probability that the face is smiling,
- **leftEarPosition (`{ x: number, y: number}`)** -- position of the left ear in image coordinates,
- **rightEarPosition (`{ x: number, y: number}`)** -- position of the right ear in image coordinates,
- **leftEyePosition (`{ x: number, y: number}`)** -- position of the left eye in image coordinates,
- **leftEyeOpenProbability (_number_)** -- probability that the left eye is open,
- **rightEyePosition (`{ x: number, y: number}`)** -- position of the right eye in image coordinates,
- **rightEyeOpenProbability (_number_)** -- probability that the right eye is open,
- **leftCheekPosition (`{ x: number, y: number}`)** -- position of the left cheek in image coordinates,
- **rightCheekPosition (`{ x: number, y: number}`)** -- position of the right cheek in image coordinates,
- **mouthPosition (`{ x: number, y: number}`)** -- position of the center of the mouth in image coordinates,
- **leftMouthPosition (`{ x: number, y: number}`)** -- position of the left edge of the mouth in image coordinates,
- **rightMouthPosition (`{ x: number, y: number}`)** -- position of the right edge of the mouth in image coordinates,
- **noseBasePosition (`{ x: number, y: number}`)** -- position of the nose base in image coordinates.

`smilingProbability`, `leftEyeOpenProbability` and `rightEyeOpenProbability` are returned only if `runClassifications` option is set to `.all`.

Positions of face landmarks are returned only if `detectLandmarks` option is set to `.all`.
