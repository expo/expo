import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';

/**
 * The vibrate pattern holds an array of values describes alternating periods in which the device is
 * vibrating and not vibrating. Each value in the array is converted to an integer, then interpreted
 * alternately as the duration of milliseconds the device should and should not vibrate.
 */
const vibrationPatterns: Record<
  NotificationFeedbackType | ImpactFeedbackStyle | 'selection',
  VibratePattern
> = {
  [NotificationFeedbackType.Success]: [40, 100, 40],
  [NotificationFeedbackType.Warning]: [50, 100, 50],
  [NotificationFeedbackType.Error]: [60, 100, 60, 100, 60],
  [ImpactFeedbackStyle.Light]: [40],
  [ImpactFeedbackStyle.Medium]: [50],
  [ImpactFeedbackStyle.Heavy]: [60],
  [ImpactFeedbackStyle.Soft]: [35],
  [ImpactFeedbackStyle.Rigid]: [45],
  selection: [50],
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
