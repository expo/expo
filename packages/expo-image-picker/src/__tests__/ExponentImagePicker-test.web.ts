import ExponentImagePicker from '../ExponentImagePicker';

describe('ExponentImagePicker', () => {
  describe('getCameraRollPermissionsAsync', () => {
    it(`is always granted`, async () => {
      let response = await ExponentImagePicker.getCameraRollPermissionsAsync();
      expect(response.granted).toBeTruthy();
      expect(response.status).toBe('granted');
    });
  });

  describe('requestCameraRollPermissionsAsync', () => {
    it(`is always granted`, async () => {
      let response = await ExponentImagePicker.getCameraRollPermissionsAsync();
      expect(response.granted).toBeTruthy();
      expect(response.status).toBe('granted');
    });
  });
});
