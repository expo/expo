---
title: FaceDetector
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-face-detector'
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

### Settings

In order to configure detector's behavior modules pass a [`DetectionOptions`](#detectionoptions) object which is then interpreted by this module.

Eg. you could use the following snippet to detect faces in fast mode without detecting landmarks or whether face is smiling:

```js
import * as FaceDetector from 'expo-face-detector';

<Camera
  // ... other props
  onFacesDetected={this.handleFacesDetected}
  faceDetectorSettings={{
    mode: FaceDetector.FaceDetectorMode.fast,
    detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
    runClassifications: FaceDetector.FaceDetectorClassifications.none,
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
