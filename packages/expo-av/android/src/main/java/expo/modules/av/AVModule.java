package expo.modules.av;

import android.content.Context;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.arguments.ReadableArguments;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;

public class AVModule extends ExportedModule implements ModuleRegistryConsumer {
  private AVManagerInterface mAVManager;

  public AVModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExponentAV";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mAVManager = moduleRegistry.getModule(AVManagerInterface.class);
  }

  @ExpoMethod
  public void setAudioIsEnabled(final Boolean value, final Promise promise) {
    mAVManager.setAudioIsEnabled(value);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setAudioMode(final ReadableArguments map, final Promise promise) {
    mAVManager.setAudioMode(map);
    promise.resolve(null);
  }

  @ExpoMethod
  public void loadForSound(final ReadableArguments source, final ReadableArguments status, final Promise promise) {
    mAVManager.loadForSound(source, status, promise);
  }

  @ExpoMethod
  void unloadForSound(final Integer key, final Promise promise) {
    mAVManager.unloadForSound(key, promise);
  }

  @ExpoMethod
  void setStatusForSound(final Integer key, final ReadableArguments status, final Promise promise) {
    mAVManager.setStatusForSound(key, status, promise);
  }

  @ExpoMethod
  void replaySound(final Integer key, final ReadableArguments status, final Promise promise) {
    mAVManager.replaySound(key, status, promise);
  }

  @ExpoMethod
  void getStatusForSound(final Integer key, final Promise promise) {
    mAVManager.getStatusForSound(key, promise);
  }

  @ExpoMethod
  void loadForVideo(final Integer tag, final ReadableArguments source, final ReadableArguments status, final Promise promise) {
    mAVManager.loadForVideo(tag, source, status, promise);
  }

  @ExpoMethod
  void unloadForVideo(final Integer tag, final Promise promise) {
    mAVManager.unloadForVideo(tag, promise);
  }

  @ExpoMethod
  void setStatusForVideo(final Integer tag, final ReadableArguments status, final Promise promise) {
    mAVManager.setStatusForVideo(tag, status, promise);
  }

  @ExpoMethod
  void replayVideo(final Integer tag, final ReadableArguments status, final Promise promise) {
    mAVManager.replayVideo(tag, status, promise);
  }

  @ExpoMethod
  void getStatusForVideo(final Integer tag, final Promise promise) {
    mAVManager.getStatusForVideo(tag, promise);
  }

  @ExpoMethod
  void prepareAudioRecorder(final ReadableArguments options, final Promise promise) {
    mAVManager.prepareAudioRecorder(options, promise);
  }

  @ExpoMethod
  void startAudioRecording(final Promise promise) {
    mAVManager.startAudioRecording(promise);
  }

  @ExpoMethod
  void pauseAudioRecording(final Promise promise) {
    mAVManager.pauseAudioRecording(promise);
  }

  @ExpoMethod
  void stopAudioRecording(final Promise promise) {
    mAVManager.stopAudioRecording(promise);
  }

  @ExpoMethod
  void getAudioRecordingStatus(final Promise promise) {
    mAVManager.getAudioRecordingStatus(promise);
  }

  @ExpoMethod
  void unloadAudioRecorder(final Promise promise) {
    mAVManager.unloadAudioRecorder(promise);
  }
}
