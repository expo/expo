import * as Haptics from 'expo-haptics';

export const name = 'Haptics';

export async function test(t) {
  t.describe('Haptics', async () => {
    t.it('selectionAsync()', async () => {
      const result = await Haptics.selectionAsync();
      t.expect(result).toBeUndefined();
    });

    t.describe('notificationAsync()', async () => {
      t.it('success', async () => {
        const result = await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        t.expect(result).toBeUndefined();
      });

      t.it('warning', async () => {
        const result = await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        t.expect(result).toBeUndefined();
      });

      t.it('error', async () => {
        const result = await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        t.expect(result).toBeUndefined();
      });
    });

    t.describe('impactAsync()', async () => {
      t.it('light', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        t.expect(result).toBeUndefined();
      });

      t.it('medium', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        t.expect(result).toBeUndefined();
      });

      t.it('heavy', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        t.expect(result).toBeUndefined();
      });

      t.it('rigid', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        t.expect(result).toBeUndefined();
      });

      t.it('soft', async () => {
        const result = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        t.expect(result).toBeUndefined();
      });
    });
  });
}
