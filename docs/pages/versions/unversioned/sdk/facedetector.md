---
title: FaceDetector
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-face-detector'
packageName: 'expo-face-detector'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-face-detector`** lets you use the power of the [Google Mobile Vision](https://developers.google.com/vision/face-detection-concepts) framework to detect faces on images.

<PlatformsSection android ios />

## Installation

<APIInstallSection />

## Usage

### Known issues

- Android does not recognize faces that aren't aligned with the interface (top of the interface matches top of the head).

### Settings

In order to configure detector's behavior modules pass a [`DetectionOptions`](#detectionoptions) object which is then interpreted by this module.

Eg. you could use the following snippet to detect faces in fast mode without detecting landmarks or whether face is smiling:

<SnackInline dependencies={['expo-camera', 'expo-face-detector']}>

```js
import * as React from 'react';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

const App = () => (
  <Camera
    // other props
    onFacesDetected={handleFacesDetected}
    faceDetectorSettings={{
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
      minDetectionInterval: 100,
      tracking: true,
    }}
  />
);

/* @hide const handleFacesDetected = ({ faces }) => { ... }; */
const handleFacesDetected = ({ faces }) => {
  console.log(faces);
};

export default App;
/* @end */
```

</SnackInline>

## API

```js
import * as FaceDetector from 'expo-face-detector';
```

<APISection packageName="expo-face-detector" apiName="FaceDetector" />
