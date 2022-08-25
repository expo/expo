package expo.modules.av.video

internal enum class FullscreenPlayerUpdate(val jsValue: Int) {
  FULLSCREEN_PLAYER_WILL_PRESENT(0),
  FULLSCREEN_PLAYER_DID_PRESENT(1),
  FULLSCREEN_PLAYER_WILL_DISMISS(2),
  FULLSCREEN_PLAYER_DID_DISMISS(3);
}
