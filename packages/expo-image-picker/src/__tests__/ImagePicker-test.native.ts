import ExponentImagePicker from '../ExponentImagePicker';
import * as ImagePicker from '../ImagePicker';

describe('ExponentImagePicker', () => {
  describe('launchCameraAsync', () => {
    it(`default options to an empty object`, async () => {
      ImagePicker.launchCameraAsync();
      expect(ExponentImagePicker.launchCameraAsync).toHaveBeenCalledWith({});
    });
  });

  describe('launchImageLibraryAsync', () => {
    it(`defaults options to an empty object`, async () => {
      ImagePicker.launchImageLibraryAsync();
      expect(ExponentImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({});
    });
  });
});
