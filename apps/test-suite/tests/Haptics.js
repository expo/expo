import * as Haptics from 'expo-haptics';

export const name = 'Haptics';

export async function test({beforeAll, describe, it, xit, xdescribe, beforeEach, jasmine,expect, ...t}) {
  describe('Haptics', async () => {
    it('selectionAsync()', async () => {
      const result = await Haptics.selectionAsync();
      expect(result).toBeUndefined();
    });

    describe('notificationAsync()', async () => {
      it('success', async () => {
        const result = await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        expect(result).toBeUndefined();
      });

      it('warning', async () => {
        const result = await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        expect(result).toBeUndefined();
      });

      it('error', async () => {
        const result = await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        expect(result).toBeUndefined();
      });
    });

    describe('impactAsync()', async () => {
      it('light', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        expect(result).toBeUndefined();
      });

      it('medium', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        expect(result).toBeUndefined();
      });

      it('heavy', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        expect(result).toBeUndefined();
      });
    });
  });
}
