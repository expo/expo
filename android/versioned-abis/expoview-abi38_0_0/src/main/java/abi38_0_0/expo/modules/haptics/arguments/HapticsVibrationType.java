package abi38_0_0.expo.modules.haptics.arguments;

public interface HapticsVibrationType {
  long[] getTimings();

  int[] getAmplitudes();

  long[] getOldSDKPattern();
}
