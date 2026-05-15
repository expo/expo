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

/**
 * On iOS Safari, `navigator.vibrate` is not supported. Instead, we can trigger
 * haptic feedback by creating a hidden `<input type="checkbox" switch>` element
 * and programmatically clicking it. This exploits the native haptic feedback that
 * iOS provides for switch toggle interactions.
 *
 * @see https://github.com/tijnjh/ios-haptics
 */
function iOSSwitchHaptic(): void {
  try {
    const labelEl = document.createElement('label');
    labelEl.ariaHidden = 'true';
    labelEl.style.display = 'none';

    const inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    inputEl.setAttribute('switch', '');
    labelEl.appendChild(inputEl);

    document.head.appendChild(labelEl);
    labelEl.click();
    document.head.removeChild(labelEl);
  } catch {}
}

/**
 * Whether the device likely supports touch haptics (coarse pointer = touchscreen).
 */
const supportsCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

function hapticWithVibrateFallback(pattern: VibratePattern): void {
  if (isVibrationAvailable()) {
    navigator.vibrate(pattern);
    return;
  }
  if (supportsCoarsePointer) {
    iOSSwitchHaptic();
  }
}

export default {
  async notificationAsync(type: NotificationFeedbackType): Promise<void> {
    if (isVibrationAvailable()) {
      navigator.vibrate(vibrationPatterns[type]);
      return;
    }
    if (!supportsCoarsePointer) return;

    // Map notification types to repeated haptic pulses
    const count = type === NotificationFeedbackType.Error ? 3 : 2;
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      iOSSwitchHaptic();
    }
  },
  async impactAsync(style: ImpactFeedbackStyle): Promise<void> {
    hapticWithVibrateFallback(vibrationPatterns[style]);
  },
  async selectionAsync(): Promise<void> {
    hapticWithVibrateFallback(vibrationPatterns.selection);
  },
};
