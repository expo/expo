import { UnavailabilityError } from '@unimodules/core';
import ExpoFaceDetector from './ExpoFaceDetector';
export async function detectFacesAsync(uri, options = {}) {
    if (!ExpoFaceDetector.detectFaces) {
        throw new UnavailabilityError('expo-face-detector', 'detectFaces');
    }
    return await ExpoFaceDetector.detectFaces({ ...options, uri });
}
export const Constants = {
    Mode: ExpoFaceDetector.Mode,
    Landmarks: ExpoFaceDetector.Landmarks,
    Classifications: ExpoFaceDetector.Classifications,
};
//# sourceMappingURL=FaceDetector.js.map