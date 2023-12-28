package expo.modules.video

object VideoViewManager {
  const val INTENT_PLAYER_KEY = "player_uuid"
  private var players = mutableMapOf<String, VideoView>()

  fun addVideoView(videoView: VideoView) {
    players[videoView.id] = videoView
  }

  fun getVideoView(id: String): VideoView {
    // TODO: throw an exception here
    return players[id] ?: throw Exception("VideoView with id $id not found")
  }

  fun removePlayer(id: String) {
    players.remove(id)
  }
}
