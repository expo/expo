package versioned.host.exp.exponent.modules.api.av.video;

public interface FullscreenVideoPlayerPresentationChangeListener {
  void onFullscreenPlayerWillPresent();
  void onFullscreenPlayerDidPresent();
  void onFullscreenPlayerWillDismiss();
  void onFullscreenPlayerDidDismiss();
}
