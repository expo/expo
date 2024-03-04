package expo.modules.video

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi

// Helper class used to keep track of all existing VideoViews and VideoPlayers
@OptIn(UnstableApi::class)
object VideoManager {
  const val INTENT_PLAYER_KEY = "player_uuid"

  // Used for sharing videoViews between VideoView and FullscreenPlayerActivity
  private var videoViews = mutableMapOf<String, VideoView>()

  // Keeps track of all existing VideoPlayers, and whether they are attached to a VideoView
  private var videoPlayersToVideoViews = mutableMapOf<VideoPlayer, ArrayList<VideoView>>()

  fun registerVideoView(videoView: VideoView) {
    videoViews[videoView.id] = videoView
  }

  fun getVideoView(id: String): VideoView {
    return videoViews[id] ?: throw VideoViewNotFoundException(id)
  }

  fun unregisterVideoView(videoView: VideoView) {
    videoViews.remove(videoView.id)
  }

  fun registerVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews[videoPlayer] = videoPlayersToVideoViews[videoPlayer] ?: arrayListOf()
  }

  fun unregisterVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews.remove(videoPlayer)
  }

  fun onVideoPlayerAttachedToView(videoPlayer: VideoPlayer, videoView: VideoView) {
    if (videoPlayersToVideoViews[videoPlayer]?.contains(videoView) == true) {
      return
    }
    videoPlayersToVideoViews[videoPlayer]?.add(videoView) ?: run {
      videoPlayersToVideoViews[videoPlayer] = arrayListOf(videoView)
    }

    if (videoPlayersToVideoViews[videoPlayer]?.size == 1) {
      videoPlayer.playbackServiceBinder?.service?.registerPlayer(videoPlayer.player)
    }
  }

  fun onVideoPlayerDetachedFromView(videoPlayer: VideoPlayer, videoView: VideoView) {
    videoPlayersToVideoViews[videoPlayer]?.remove(videoView)

    // Unregister disconnected VideoPlayers from the playback service
    if (videoPlayersToVideoViews[videoPlayer] == null || videoPlayersToVideoViews[videoPlayer]?.size == 0) {
      videoPlayer.playbackServiceBinder?.service?.unregisterPlayer(videoPlayer.player)
    }
  }

  fun onAppForegrounded() {
    // TODO: Left here for future use
  }

  fun onAppBackgrounded() {
    for (videoView in videoViews.values) {
      if (videoView.videoPlayer?.staysActiveInBackground == false) {
        videoView.videoPlayer?.player?.pause()
      }
    }
  }
}
