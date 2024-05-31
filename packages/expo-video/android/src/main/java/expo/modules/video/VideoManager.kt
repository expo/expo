package expo.modules.video

import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import expo.modules.video.records.VideoSource
import java.lang.ref.WeakReference

// Helper class used to keep track of all existing VideoViews and VideoPlayers
@OptIn(UnstableApi::class)
object VideoManager {
  const val INTENT_PLAYER_KEY = "player_uuid"

  // Used for sharing videoViews between VideoView and FullscreenPlayerActivity
  private var videoViews = mutableMapOf<String, VideoView>()

  // Keeps track of all existing VideoPlayers, and whether they are attached to a VideoView
  private var videoPlayersToVideoViews = mutableMapOf<VideoPlayer, MutableList<VideoView>>()

  // Keeps track of all existing MediaItems and their corresponding VideoSources. Used for recognizing source of MediaItems.
  private var mediaItemsToVideoSources = mutableMapOf<String, WeakReference<VideoSource>>()

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
    videoPlayersToVideoViews[videoPlayer] = videoPlayersToVideoViews[videoPlayer] ?: mutableListOf()
  }

  fun unregisterVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews.remove(videoPlayer)
  }

  fun registerVideoSourceToMediaItem(mediaItem: MediaItem, videoSource: VideoSource) {
    mediaItemsToVideoSources[mediaItem.mediaId] = WeakReference(videoSource)
  }

  fun getVideoSourceFromMediaItem(mediaItem: MediaItem?): VideoSource? {
    if (mediaItem == null) {
      return null
    }
    return mediaItemsToVideoSources[mediaItem.mediaId]?.get()
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

  fun onAppForegrounded() = Unit

  fun onAppBackgrounded() {
    for (videoView in videoViews.values) {
      if (videoView.videoPlayer?.staysActiveInBackground == false &&
        !videoView.willEnterPiP &&
        !videoView.isInFullscreen
      ) {
        videoView.videoPlayer?.player?.pause()
      }
    }
  }
}
