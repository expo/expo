---
title: FaceDetector
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

`FaceDetector` lets you use the power of [Google Mobile Vision](https://developers.google.com/vision/face-detection-concepts) framework to detect faces on images.

## Known issues

- Android does not recognize faces that aren't aligned with the interface (top of the interface matches top of the head).

## Comprehensive Example

Check out a full example at [expo/camerja](https://github.com/expo/camerja). You can try it with Expo at [@community/camerja](https://expo.io/@community/camerja).

`FaceDetector` is used in Gallery screen — it should detect faces on saved photos and show the probability that the face is smiling.

## Methods

To use methods that `FaceDetector` exposes one just has to import the module. (In detached apps on iOS face detection will be supported only if you add the `FaceDetector` subspec to your project. Refer to [Adding the Payments Module on iOS](../payments/#adding-the-payments-module-on-ios) for an example of adding a subspec to your detached project.)

```javascript
import { FaceDetector } from 'expo';

// ...
detectFaces = async (imageUri) => {
  const options = { mode: FaceDetector.Constants.Mode.fast };
  return await FaceDetector.detectFacesAsync(imageUri, options);
};
// ...
```

### `detectFacesAsync`

Detect faces on a picture.

#### Arguments

- **uri : `string`** -- `file://` URI to the image.
- **options? : `object`** -- A map of options:
  - **mode? : `FaceDetector.Constants.Mode`** -- Whether to detect faces in fast or accurate mode. Use `FaceDetector.Constants.Mode.{fast, accurate}`.
  - **detectLandmarks? : `FaceDetector.Constants.Landmarks`** -- Whether to detect and return landmarks positions on the face (ears, eyes, mouth, cheeks, nose). Use `FaceDetector.Constants.Landmarks.{all, none}`.
  - **runClassifications? : `FaceDetector.Constants.Classifications`** -- Whether to run additional classifications on detected faces (smiling probability, open eye probabilities). Use `FaceDetector.Constants.Classifications.{all, none}`.

#### Returns

Returns a Promise that resolves to an object: `{ faces, image }` where `faces` is an array of the detected faces and `image` is an object containing `uri: string` of the image, `width: number` of the image in pixels, `height: number` of the image in pixels and `orientation: number` of the image (value conforms to the EXIF orientation tag standard).

##### Detected face schema

A detected face is an object containing at most following fields:

- **bounds : `object`** -- an object containing:
  - **origin (`{ x: number, y: number }`)** -- position of the top left corner of a square containing the face in image coordinates,
  - **size (`{ width: number, height: number }`)** -- size of the square containing the face in image coordinates,
- **rollAngle : `number`** -- roll angle of the face (bank),
- **yawAngle : `number`** -- yaw angle of the face (heading, turning head left or right),
- **smilingProbability : `number`** -- probability that the face is smiling,
- **leftEarPosition (`{ x: number, y: number}`)** -- position of the left ear in image coordinates,
- **rightEarPosition (`{ x: number, y: number}`)** -- position of the right ear in image coordinates,
- **leftEyePosition (`{ x: number, y: number}`)** -- position of the left eye in image coordinates,
- **leftEyeOpenProbability : `number`** -- probability that the left eye is open,
- **rightEyePosition (`{ x: number, y: number}`)** -- position of the right eye in image coordinates,
- **rightEyeOpenProbability : `number`** -- probability that the right eye is open,
- **leftCheekPosition (`{ x: number, y: number}`)** -- position of the left cheek in image coordinates,
- **rightCheekPosition (`{ x: number, y: number}`)** -- position of the right cheek in image coordinates,
- **mouthPosition (`{ x: number, y: number}`)** -- position of the center of the mouth in image coordinates,
- **leftMouthPosition (`{ x: number, y: number}`)** -- position of the left edge of the mouth in image coordinates,
- **rightMouthPosition (`{ x: number, y: number}`)** -- position of the right edge of the mouth in image coordinates,
- **noseBasePosition (`{ x: number, y: number}`)** -- position of the nose base in image coordinates.

`smilingProbability`, `leftEyeOpenProbability` and `rightEyeOpenProbability` are returned only if `runClassifications` option is set to `.all`.

Positions of face landmarks are returned only if `detectLandmarks` option is set to `.all`.
