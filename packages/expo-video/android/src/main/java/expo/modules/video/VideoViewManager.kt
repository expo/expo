package expo.modules.video

object VideoViewManager {
  const val INTENT_PLAYER_KEY = "player_uuid"
  private var players = mutableMapOf<String, VideoView>()

  fun addVideoView(videoView: VideoView) {
    players[videoView.id] = videoView
  }

  fun getVideoView(id: String): VideoView {
    return players[id] ?: throw VideoViewNotFoundException(id)
  }

  fun removeVideoView(id: String) {
    players.remove(id)
  }
}
