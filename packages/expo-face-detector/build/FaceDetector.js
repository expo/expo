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
    FaceDetectorLandmarks[FaceDetectorLandmarks["all"] = 1] = "all";
    FaceDetectorLandmarks[FaceDetectorLandmarks["none"] = 2] = "none";
})(FaceDetectorLandmarks || (FaceDetectorLandmarks = {}));
// @docsMissing
export var FaceDetectorClassifications;
(function (FaceDetectorClassifications) {
    FaceDetectorClassifications[FaceDetectorClassifications["all"] = 1] = "all";
    FaceDetectorClassifications[FaceDetectorClassifications["none"] = 2] = "none";
})(FaceDetectorClassifications || (FaceDetectorClassifications = {}));
// @needsAudit
/**
 * Detect faces on a picture.
 * @param uri `file://` URI to the image.
 * @param options A map of detection options.
 * @return Returns a Promise which fulfils with [`DetectionResult`](#detectionresult) object.
 */
export async function detectFacesAsync(uri, options = {}) {
    if (!ExpoFaceDetector.detectFaces) {
        throw new UnavailabilityError('expo-face-detector', 'detectFaces');
    }
    return await ExpoFaceDetector.detectFaces({ ...options, uri });
}
//# sourceMappingURL=FaceDetector.js.map