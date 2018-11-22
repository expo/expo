package abi29_0_0.host.exp.exponent.modules.api.av;

public interface AudioEventHandler {

  void pauseImmediately();

  boolean requiresAudioFocus();

  void updateVolumeMuteAndDuck();

  void handleAudioFocusInterruptionBegan();

  void handleAudioFocusGained();

  void onPause();

  void onResume();
}
