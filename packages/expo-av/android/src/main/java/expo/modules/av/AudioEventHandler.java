package expo.modules.av;

public interface AudioEventHandler {

  void pauseImmediately();

  boolean requiresAudioFocus();

  void updateVolumeMuteAndDuck();

  void handleAudioFocusInterruptionBegan();

  void handleAudioFocusGained();

  void onPause();

  void onResume();
}
