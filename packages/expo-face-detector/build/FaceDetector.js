import { UnavailabilityError } from 'expo-modules-core';
import ExpoFaceDetector from './ExpoFaceDetector';
// @docsMissing
export var FaceDetectorMode;
(function (FaceDetectorMode) {
    FaceDetectorMode[FaceDetectorMode["fast"] = 1] = "fast";
    FaceDetectorMode[FaceDetectorMode["accurate"] = 2] = "accurate";
})(FaceDetectorMode || (FaceDetectorMode = {}));
// @docsMissing
export var FaceDetectorLandmarks;
(function (FaceDetectorLandmarks) {
    FaceDetectorLandmarks[FaceDetectorLandmarks["none"] = 1] = "none";
    FaceDetectorLandmarks[FaceDetectorLandmarks["all"] = 2] = "all";
})(FaceDetectorLandmarks || (FaceDetectorLandmarks = {}));
// @docsMissing
export var FaceDetectorClassifications;
(function (FaceDetectorClassifications) {
    FaceDetectorClassifications[FaceDetectorClassifications["none"] = 1] = "none";
    FaceDetectorClassifications[FaceDetectorClassifications["all"] = 2] = "all";
})(FaceDetectorClassifications || (FaceDetectorClassifications = {}));
// @needsAudit
/**
 * Detect faces on a picture.
 * @param uri `file://` URI to the image.
 * @param options A map of detection options.
 * @return Returns a Promise which fulfils with [`DetectionResult`](#detectionresult) object.
 */
export async function detectFacesAsync(uri, options = {}) {
    if (!ExpoFaceDetector || !ExpoFaceDetector.detectFaces) {
        if (global.expo?.modules?.ExponentConstants?.appOwnership === 'expo') {
            console.warn([
                "ExpoFaceDetector has been removed from Expo Go. To use this functionality, you'll have to create a development build or prebuild using npx expo run:android|ios commands.",
                'Learn more: https://expo.fyi/face-detector-removed',
                'Learn more about development builds: https://docs.expo.dev/develop/development-builds/create-a-build/',
                'Learn more about prebuild: https://docs.expo.dev/workflow/prebuild/',
            ].join('\n\n'));
        }
        throw new UnavailabilityError('expo-face-detector', 'detectFaces');
    }
    return await ExpoFaceDetector.detectFaces({ ...options, uri });
}
//# sourceMappingURL=FaceDetector.js.map