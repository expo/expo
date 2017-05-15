package abi17_0_0.host.exp.exponent.modules.api.av;

public interface AudioEventHandler {

  void pauseImmediately();

  boolean isUsingAudioFocus();

  void updateVolumeMuteAndDuck();

  void handleAudioFocusInterruptionBegan();

  void handleAudioFocusGained();

  void onPause();

  void onResume();
}
