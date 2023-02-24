import ExponentImagePicker from '../ExponentImagePicker';

describe('ExponentImagePicker', () => {
  describe('getMediaLibraryPermissionsAsync', () => {
    it(`is always granted`, async () => {
      const response = await ExponentImagePicker.getMediaLibraryPermissionsAsync(true);
      expect(response.granted).toBeTruthy();
      expect(response.status).toBe('granted');
    });
  });

  describe('requestMediaLibraryPermissionsAsync', () => {
    it(`is always granted`, async () => {
      const response = await ExponentImagePicker.requestMediaLibraryPermissionsAsync(true);
      expect(response.granted).toBeTruthy();
      expect(response.status).toBe('granted');
    });
  });
});
