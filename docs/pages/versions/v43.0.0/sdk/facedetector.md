---
title: FaceDetector
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-face-detector'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-face-detector`** lets you use the power of the [Google Mobile Vision](https://developers.google.com/vision/face-detection-concepts) framework to detect faces on images.

<PlatformsSection android ios web={{ pending: 'https://github.com/expo/expo/issues/6888' }} />

## Installation

<InstallSection packageName="expo-face-detector" />

## Usage

### Known issues

- Android does not recognize faces that aren't aligned with the interface (top of the interface matches top of the head).

### Comprehensive Example

Check out a full example at [expo/camerja](https://github.com/expo/camerja). You can try it with Expo at [@documentation/camerja](https://expo.dev/@documentation/camerja).

`FaceDetector` is used in Gallery screen — it should detect faces on saved photos and show the probability that the face is smiling.

### Intermodule interface

Other modules, like eg. [Camera](camera.md) are able to use this `FaceDetector`.

### Settings

In order to configure detector's behavior modules pass a [`DetectionOptions`](#detectionoptions) object which is then interpreted by this module.

Eg. you could use the following snippet to detect faces in fast mode without detecting landmarks or whether face is smiling:

```js
import * as FaceDetector from 'expo-face-detector';

<Camera
  // ... other props
  onFacesDetected={this.handleFacesDetected}
  faceDetectorSettings={{
    mode: FaceDetector.Constants.Mode.fast,
    detectLandmarks: FaceDetector.Constants.Landmarks.none,
    runClassifications: FaceDetector.Constants.Classifications.none,
    minDetectionInterval: 100,
    tracking: true,
  }}
/>;
```

## API

```js
import * as FaceDetector from 'expo-face-detector';
```

<APISection packageName="expo-face-detector" apiName="FaceDetector" />