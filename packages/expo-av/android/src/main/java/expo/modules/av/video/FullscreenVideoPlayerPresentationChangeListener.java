package expo.modules.av.video;

public interface FullscreenVideoPlayerPresentationChangeListener {
  void onFullscreenPlayerWillPresent();
  void onFullscreenPlayerDidPresent();
  void onFullscreenPlayerWillDismiss();
  void onFullscreenPlayerDidDismiss();
}
