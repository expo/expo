import { Platform } from 'expo-modules-core';

import ExpoFaceDetector from '../ExpoFaceDetector';
import * as FaceDetector from '../FaceDetector';

describe('detectFacesAsync', () => {
  it(`merges props`, async () => {
    const uri = '<DEBUG_URI>';
    const options = {};
    try {
      await FaceDetector.detectFacesAsync(uri, options);
      expect(ExpoFaceDetector.detectFaces).toHaveBeenLastCalledWith({ ...options, uri });
    } catch (e) {
      if (Platform.OS === 'web') {
        expect(e.code).toBe('ERR_UNAVAILABLE');
      }
    }
  });
});
