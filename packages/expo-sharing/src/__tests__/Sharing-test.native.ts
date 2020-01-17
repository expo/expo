import * as Sharing from '../Sharing';

describe('Sharing', () => {
  describe('isAvailableAsync', () => {
    it(`is always true on native`, async () => {
      let isAvailable = await Sharing.isAvailableAsync();
      expect(isAvailable).toBeTruthy();
    });
  });
});
