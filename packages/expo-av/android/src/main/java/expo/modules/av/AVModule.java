package expo.modules.av;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

public class AVModule extends ExportedModule {
  private AVManagerInterface mAVManager;

  public AVModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExponentAV";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
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
  public void unloadForSound(final Integer key, final Promise promise) {
    mAVManager.unloadForSound(key, promise);
  }

  @ExpoMethod
  public void setStatusForSound(final Integer key, final ReadableArguments status, final Promise promise) {
    mAVManager.setStatusForSound(key, status, promise);
  }

  @ExpoMethod
  public void replaySound(final Integer key, final ReadableArguments status, final Promise promise) {
    mAVManager.replaySound(key, status, promise);
  }

  @ExpoMethod
  public void getStatusForSound(final Integer key, final Promise promise) {
    mAVManager.getStatusForSound(key, promise);
  }

  @ExpoMethod
  public void loadForVideo(final Integer tag, final ReadableArguments source, final ReadableArguments status, final Promise promise) {
    mAVManager.loadForVideo(tag, source, status, promise);
  }

  @ExpoMethod
  public void unloadForVideo(final Integer tag, final Promise promise) {
    mAVManager.unloadForVideo(tag, promise);
  }

  @ExpoMethod
  public void setStatusForVideo(final Integer tag, final ReadableArguments status, final Promise promise) {
    mAVManager.setStatusForVideo(tag, status, promise);
  }

  @ExpoMethod
  public void replayVideo(final Integer tag, final ReadableArguments status, final Promise promise) {
    mAVManager.replayVideo(tag, status, promise);
  }

  @ExpoMethod
  public void getStatusForVideo(final Integer tag, final Promise promise) {
    mAVManager.getStatusForVideo(tag, promise);
  }

  @ExpoMethod
  public void prepareAudioRecorder(final ReadableArguments options, final Promise promise) {
    mAVManager.prepareAudioRecorder(options, promise);
  }

  @ExpoMethod
  public void startAudioRecording(final Promise promise) {
    mAVManager.startAudioRecording(promise);
  }

  @ExpoMethod
  public void pauseAudioRecording(final Promise promise) {
    mAVManager.pauseAudioRecording(promise);
  }

  @ExpoMethod
  public void stopAudioRecording(final Promise promise) {
    mAVManager.stopAudioRecording(promise);
  }

  @ExpoMethod
  public void getAudioRecordingStatus(final Promise promise) {
    mAVManager.getAudioRecordingStatus(promise);
  }

  @ExpoMethod
  public void unloadAudioRecorder(final Promise promise) {
    mAVManager.unloadAudioRecorder(promise);
  }
}
