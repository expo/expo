import { Platform } from 'expo';

import ExpoHaptics from '../ExpoHaptics';
import * as Haptics from '../Haptics';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('synchronous API', () => {
  it(`triggers notification feedback`, () => {
    Haptics.notification(Haptics.NotificationFeedbackType.Warning);
    expect(ExpoHaptics.notification).toHaveBeenCalledTimes(1);
    expect(ExpoHaptics.notification).toHaveBeenCalledWith('warning');
  });

  it(`defaults to the success notification type`, () => {
    Haptics.notification();
    expect(ExpoHaptics.notification).toHaveBeenCalledWith('success');
  });

  it(`triggers impact feedback`, () => {
    Haptics.impact(Haptics.ImpactFeedbackStyle.Heavy);
    expect(ExpoHaptics.impact).toHaveBeenCalledTimes(1);
    expect(ExpoHaptics.impact).toHaveBeenCalledWith('heavy');
  });

  it(`defaults to the medium impact style`, () => {
    Haptics.impact();
    expect(ExpoHaptics.impact).toHaveBeenCalledWith('medium');
  });

  it(`triggers selection feedback`, () => {
    Haptics.selection();
    expect(ExpoHaptics.selection).toHaveBeenCalledTimes(1);
  });

  it(`performs Android haptics only on Android`, () => {
    Haptics.performAndroidHaptics(Haptics.AndroidHaptics.Clock_Tick);
    if (Platform.OS === 'android') {
      expect(ExpoHaptics.performHaptics).toHaveBeenCalledWith('clock-tick');
    } else {
      expect(ExpoHaptics.performHaptics).not.toHaveBeenCalled();
    }
  });
});

describe('asynchronous API', () => {
  it(`triggers notification feedback`, async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it(`triggers impact feedback`, async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it(`triggers selection feedback`, async () => {
    await Haptics.selectionAsync();
    expect(ExpoHaptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
});
