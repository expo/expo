import ExpoFaceDetector from '../ExpoFaceDetector';
import * as FaceDetector from '../FaceDetector';

describe('detectFacesAsync', () => {
  it(`merges props`, async () => {
    const uri = '<DEBUG_URI>';
    const options = {};
    await FaceDetector.detectFacesAsync(uri, options);

    expect(ExpoFaceDetector.detectFaces).toHaveBeenLastCalledWith({ ...options, uri });
  });
});
