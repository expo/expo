package expo.modules.haptics.arguments;

import android.support.annotation.NonNull;

public enum HapticsNotificationType implements HapticsVibrationType {
  SUCCESS(
      "success",
      new long[] { 0, 35, 65, 21 },
      new int[] { 0, 250, 0, 180 },
      new long[] { 0, 35, 65, 21 }
      ),
  WARNING(
      "warning",
      new long[] { 0, 30, 40, 30, 50, 60 },
      new int[] { 255, 255, 255, 255, 255, 255 },
      new long[] { 0, 30, 40, 30, 50, 60 }
      ),
  ERROR(
      "error",
      new long[] { 0, 27, 45, 50 },
      new int[] { 0, 120, 0, 250 },
      new long[] { 0, 27, 45, 50 }
      );

  private final String mType;
  private final long[] mTimings;
  private final int[] mAmplitudes;
  private final long[] mOldSDKPattern;

  HapticsNotificationType(String type, long[] timings, int[] amplitudes, long[] oldSDKPattern) {
    mType = type;
    mTimings = timings;
    mAmplitudes = amplitudes;
    mOldSDKPattern = oldSDKPattern;
  }

  public static @NonNull
  HapticsNotificationType fromString(String type) throws HapticsInvalidArgumentException {
    for (HapticsNotificationType nt: values()) {
      if (nt.mType.equals(type)) {
        return nt;
      }
    }
    throw new HapticsInvalidArgumentException("'type' must be one of ['success', 'warning', 'error']. Obtained '" + type + "'.");
  }

  @Override
  public long[] getTimings() {
    return mTimings;
  }

  @Override
  public int[] getAmplitudes() {
    return mAmplitudes;
  }

  @Override
  public long[] getOldSDKPattern() {
    return mOldSDKPattern;
  }
}
