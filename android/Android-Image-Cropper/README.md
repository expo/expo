Android Image Cropper
=======
[![build status](https://travis-ci.org/ArthurHub/Android-Image-Cropper.svg)](https://travis-ci.org/ArthurHub/Android-Image-Cropper) 
[![Codacy Badge](https://api.codacy.com/project/badge/grade/4d3781df0cce40959881a8d91365407a)](https://www.codacy.com/app/tep-arthur/Android-Image-Cropper)
[![Android Arsenal](https://img.shields.io/badge/Android%20Arsenal-Android--Image--Cropper-green.svg?style=true)](https://android-arsenal.com/details/1/3487)
[ ![Download](https://api.bintray.com/packages/arthurhub/maven/Android-Image-Cropper/images/download.svg) ](https://bintray.com/arthurhub/maven/Android-Image-Cropper/_latestVersion)


**Powerful** (Zoom, Rotation, Multi-Source), **customizable** (Shape, Limits, Style), **optimized** (Async, Sampling, Matrix) and **simple** image cropping library for Android.

![Crop](https://github.com/ArthurHub/Android-Image-Cropper/blob/master/art/demo.gif?raw=true)

## Usage
*For a working implementation, please have a look at the Sample Project*

[See GitHub Wiki for more info.](https://github.com/ArthurHub/Android-Image-Cropper/wiki)

Include the library

 ```
 compile 'com.theartofdev.edmodo:android-image-cropper:2.1.+'
 ```

### Using Activity

2. Add `CropImageActivity` into your AndroidManifest.xml
 ```xml
 <activity android:name="com.theartofdev.edmodo.cropper.CropImageActivity"/>
 ```

3. Start `CropImageActivity` using builder pattern from your activity
 ```java
 CropImage.activity(imageUri)
    .setGuidelines(CropImageView.Guidelines.ON)
    .start(this);
 ```

4. Override `onActivityResult` method in your activity to get crop result
 ```java
 @Override
 public void onActivityResult(int requestCode, int resultCode, Intent data) {
     if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
         CropImage.ActivityResult result = CropImage.getActivityResult(data);
         if (resultCode == RESULT_OK) {
             Uri resultUri = result.getUri();
         } else if (resultCode == CropImage.CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE) {
             Exception error = result.getError();
         }
     }
 }
 ```

### Using View
2. Add `CropImageView` into your activity
 ```xml
 <!-- Image Cropper fill the remaining available height -->
 <com.theartofdev.edmodo.cropper.CropImageView
    xmlns:custom="http://schemas.android.com/apk/res-auto"
    android:id="@+id/cropImageView"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1"/>
 ```

3. Set image to crop
 ```java
 cropImageView.setImageBitmap(bitmap);
 // or
 cropImageView.setImageUriAsync(uri);
 ```

4. Get cropped image
 ```java
 Bitmap cropped = cropImageView.getCroppedImage();
 // or (must subscribe to async event using cropImageView.setOnGetCroppedImageCompleteListener(listener))
 cropImageView.getCroppedImageAsync();
 ```

## Features
- Built-in `CropImageActivity`.
- Set cropping image as Bitmap, Resource or Android URI (Gallery, Camera, Dropbox, etc.).
- Image rotation during cropping.
- Auto zoom-in/out to relevant cropping area.
- Auto rotate bitmap by image Exif data.
- Set result image min/max limits in pixels.
- Set initial crop window size/location.
- Bitmap memory optimization.
- API Level 10.
- More..
 
## Customizations
- Cropping window shape: Rectangular or Oval (cube/circle by fixing aspect ratio).
- Cropping window aspect ratio: Free, 1:1, 4:3, 16:9 or Custom.
- Guidelines appearance: Off / Always On / Show on Toch.
- Cropping window Border line, border corner and guidelines thickness and color.
- Cropping background color.

For more information, see the [GitHub Wiki](https://github.com/ArthurHub/Android-Image-Cropper/wiki). 

## Posts
 - [Android cropping image from camera or gallery](http://theartofdev.com/2015/02/15/android-cropping-image-from-camera-or-gallery/)
 - [Android Image Cropper async support and custom progress UI](http://theartofdev.com/2016/01/15/android-image-cropper-async-support-and-custom-progress-ui/)
 - [Adding auto-zoom feature to Android-Image-Cropper](https://theartofdev.com/2016/04/25/adding-auto-zoom-feature-to-android-image-cropper/)

## Change log
*2.1.1*
- Built-in `CropImageActivity` for quick start and common scenarios.
- Save cropped image to Uri API `saveCroppedImageAsync(Uri)`.
- Handle possible out-of-memory in image load by down-sampling until succeed.
- Minor fixes.

*2.0.1* (Beta)

- Fix counter clockwise rotation resulting in negative degrees (#54). 

*2.0.0* (Beta)

- **Auto-zoom**: zoom-in when crop window takes less than 50% of the image, zoom-out when more than 65%.
- Handle cropping of non-straight angles rotations for URI loaded images.
- Improve performance for image rotation.
- Improve performance for rotation due to exif orientation data.
- Improve performance for orientation change.
- Preserve crop window on rotations for straight angles - 90/180/270.
- Preserve crop window on orientation change.
- Handle max allowed texture size on device by down-sampling to be within the limit.
- API breaking changes:
 - Renamed `CropImageHelper` to `CropImage`
 - Removed `getActualCropRect()` and `getActualCropRectNoRotation()`, replaced by 'getCropPoints()' and 'getCropRect()'.
 - Moved to custom `CropImageView.ScaleType` for 'setScaleType()'
 - Removed `CropShape` from `getCroppedImage` API, added `CropImage.toOvalBitmap`.
- Known issues:
 - Boundaries and orientation change for non-straight angle rotation of images.
 
See [full change log](https://github.com/ArthurHub/Android-Image-Cropper/wiki/Change-Log).

## License
Originally forked from [edmodo/cropper](https://github.com/edmodo/cropper).

Copyright 2016, Arthur Teplitzki, 2013, Edmodo, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this work except in compliance with the   License.
You may obtain a copy of the License in the LICENSE file, or at:

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS   IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
