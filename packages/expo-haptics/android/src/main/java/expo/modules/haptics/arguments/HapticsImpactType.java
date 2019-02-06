package expo.modules.haptics.arguments;

import android.support.annotation.NonNull;

public enum HapticsImpactType implements HapticsVibrationType {
  LIGHT(
      "light",
      new long[] { 0, 50 },
      new int[] { 0, 110 },
      new long[] { 0, 20 }
      ),
  MEDIUM(
      "medium",
      new long[] { 0, 43 },
      new int[] { 0, 180 },
      new long[] { 0, 43 }
      ),
  HEAVY(
      "heavy",
      new long[] { 0, 60 },
      new int[] { 0, 255 },
      new long[] { 0, 61 }
      );

  private final String mType;
  private final long[] mTimings;
  private final int[] mAmplitudes;
  private final long[] mOldSDKPattern;

  HapticsImpactType(String type, long[] timings, int[] amplitudes, long[] oldSDKPattern) {
    mType = type;
    mTimings = timings;
    mAmplitudes = amplitudes;
    mOldSDKPattern = oldSDKPattern;
  }

  public static @NonNull
  HapticsImpactType fromString(String style) throws HapticsInvalidArgumentException {
    for (HapticsImpactType nt: values()) {
      if (nt.mType.equals(style)) {
        return nt;
      }
    }
    throw new HapticsInvalidArgumentException("'style' must be one of ['light', 'medium', 'heavy']. Obtained " + style + "'.");
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
