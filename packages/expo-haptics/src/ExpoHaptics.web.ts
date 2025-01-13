import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';

const vibrationPatterns: Record<
  NotificationFeedbackType | ImpactFeedbackStyle | 'selection',
  VibratePattern
> = {
  [NotificationFeedbackType.Success]: [50],
  [NotificationFeedbackType.Warning]: [50, 50, 50],
  [NotificationFeedbackType.Error]: [200, 100, 200],
  [ImpactFeedbackStyle.Light]: [30],
  [ImpactFeedbackStyle.Medium]: [50],
  [ImpactFeedbackStyle.Heavy]: [80],
  [ImpactFeedbackStyle.Soft]: [20],
  [ImpactFeedbackStyle.Rigid]: [100],
  selection: [30],
};

function isVibrationAvailable(): boolean {
  return typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator;
}

export default {
  async notificationAsync(type: NotificationFeedbackType): Promise<void> {
    if (!isVibrationAvailable()) {
      return;
    }
    navigator.vibrate(vibrationPatterns[type]);
  },
  async impactAsync(style: ImpactFeedbackStyle): Promise<void> {
    if (!isVibrationAvailable()) {
      return;
    }
    navigator.vibrate(vibrationPatterns[style]);
  },
  async selectionAsync(): Promise<void> {
    if (!isVibrationAvailable()) {
      return;
    }
    navigator.vibrate(vibrationPatterns.selection);
  },
};
