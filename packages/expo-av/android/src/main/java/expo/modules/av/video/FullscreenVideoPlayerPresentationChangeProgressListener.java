package expo.modules.av.video;

import androidx.annotation.Nullable;

public abstract class FullscreenVideoPlayerPresentationChangeProgressListener implements FullscreenVideoPlayerPresentationChangeListener {
  @Override
  public void onFullscreenPlayerWillDismiss() {}

  @Override
  public void onFullscreenPlayerDidPresent() {}

  @Override
  public void onFullscreenPlayerDidDismiss() {}

  @Override
  public void onFullscreenPlayerWillPresent() {}

  void onFullscreenPlayerPresentationTriedToInterrupt() {}

  void onFullscreenPlayerPresentationInterrupted() {}

  void onFullscreenPlayerPresentationError(@Nullable String errorMessage) {}
}
