package expo.modules.av;

import android.content.Context;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.av.video.VideoView;

public interface AVManagerInterface {
  void registerVideoViewForAudioLifecycle(final VideoView videoView);

  void unregisterVideoViewForAudioLifecycle(final VideoView videoView);

  void abandonAudioFocusIfUnused();

  Context getContext();

  float getVolumeForDuckAndFocus(boolean isMuted, float volume);

  void acquireAudioFocus() throws AudioFocusNotAcquiredException;

  void setAudioIsEnabled(final Boolean value);

  void setAudioMode(final ReadableArguments map);

  void loadForSound(final ReadableArguments source, final ReadableArguments status, final Promise promise);

  void unloadForSound(final Integer key, final Promise promise);

  void setStatusForSound(final Integer key, final ReadableArguments status, final Promise promise);

  void replaySound(final Integer key, final ReadableArguments status, final Promise promise);

  void getStatusForSound(final Integer key, final Promise promise);

  void loadForVideo(final Integer tag, final ReadableArguments source, final ReadableArguments status, final Promise promise);

  void unloadForVideo(final Integer tag, final Promise promise);

  void setStatusForVideo(final Integer tag, final ReadableArguments status, final Promise promise);

  void replayVideo(final Integer tag, final ReadableArguments status, final Promise promise);

  void getStatusForVideo(final Integer tag, final Promise promise);

  void prepareAudioRecorder(final ReadableArguments options, final Promise promise);

  void startAudioRecording(final Promise promise);

  void pauseAudioRecording(final Promise promise);

  void stopAudioRecording(final Promise promise);

  void getAudioRecordingStatus(final Promise promise);

  void unloadAudioRecorder(final Promise promise);

  ModuleRegistry getModuleRegistry();
}
