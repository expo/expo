package expo.modules.video

import android.app.Activity
import android.app.PictureInPictureParams
import android.os.Build
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.video.player.VideoPlayer

// Helper class used to keep track of all existing VideoViews and VideoPlayers
@OptIn(UnstableApi::class)
object VideoManager {
  const val INTENT_PLAYER_KEY = "player_uuid"

  // Used for sharing videoViews between VideoView and FullscreenPlayerActivity
  private var videoViews = mutableMapOf<String, VideoView>()

  // Keeps track of all existing VideoPlayers, and whether they are attached to a VideoView
  private var videoPlayersToVideoViews = mutableMapOf<VideoPlayer, MutableList<VideoView>>()

  private lateinit var audioFocusManager: AudioFocusManager

  fun onModuleCreated(appContext: AppContext) {
    audioFocusManager = AudioFocusManager(appContext)
  }

  fun registerVideoView(videoView: VideoView) {
    videoViews[videoView.id] = videoView
  }

  fun getVideoView(id: String): VideoView {
    return videoViews[id] ?: throw VideoViewNotFoundException(id)
  }

  fun unregisterVideoView(videoView: VideoView, appContext: AppContext) {
    videoViews.remove(videoView.id)

    // It is possible that the user configured their video to enter PiP mode automatically
    // When they navigate away from the screen containing videos in that case, the PiP mode stays enabled by default
    // Which would cause the entire activity to still go into PiP mode - it is safe to assume that the user wants
    // the PiP behavior ONLY when they are watching a video.
    // If there are no more VideoViews, we can assume we left the screen containing videos
    // And therefore we should explicitly disable PiP mode just in case
    if (videoViews.isEmpty()) {
      val currentActivity = appContext.throwingActivity

      if (Build.VERSION.SDK_INT >= 31 && isPictureInPictureSupported(currentActivity)) {
        runWithPiPMisconfigurationSoftHandling {
          currentActivity.setPictureInPictureParams(PictureInPictureParams.Builder().setAutoEnterEnabled(false).build())
        }
      }
    }
  }

  fun registerVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews[videoPlayer] = videoPlayersToVideoViews[videoPlayer] ?: mutableListOf()
    audioFocusManager.registerPlayer(videoPlayer)
  }

  fun unregisterVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews.remove(videoPlayer)
    audioFocusManager.unregisterPlayer(videoPlayer)
  }

  fun onVideoPlayerAttachedToView(videoPlayer: VideoPlayer, videoView: VideoView) {
    if (videoPlayersToVideoViews[videoPlayer]?.contains(videoView) == true) {
      return
    }
    videoPlayersToVideoViews[videoPlayer]?.add(videoView) ?: run {
      videoPlayersToVideoViews[videoPlayer] = arrayListOf(videoView)
    }

    if (videoPlayersToVideoViews[videoPlayer]?.size == 1) {
      videoPlayer.serviceConnection.playbackServiceBinder?.service?.registerPlayer(videoPlayer)
    }
  }

  fun onVideoPlayerDetachedFromView(videoPlayer: VideoPlayer, videoView: VideoView) {
    videoPlayersToVideoViews[videoPlayer]?.remove(videoView)

    // Unregister disconnected VideoPlayers from the playback service
    if (videoPlayersToVideoViews[videoPlayer] == null || videoPlayersToVideoViews[videoPlayer]?.size == 0) {
      videoPlayer.serviceConnection.playbackServiceBinder?.service?.unregisterPlayer(videoPlayer.player)
    }
  }

  fun isVideoPlayerAttachedToView(videoPlayer: VideoPlayer): Boolean {
    return videoPlayersToVideoViews[videoPlayer]?.isNotEmpty() ?: false
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

  // We can't check if AndroidManifest.xml is configured properly, so we have to handle the exceptions ourselves to prevent crashes
  fun runWithPiPMisconfigurationSoftHandling(shouldThrow: Boolean = false, ignore: Boolean = false, block: () -> Any?) {
    try {
      block()
    } catch (e: IllegalStateException) {
      if (ignore) {
        return
      }
      Log.e("ExpoVideo", "Current activity does not support picture-in-picture. Make sure you have configured the `expo-video` config plugin correctly.")
      if (shouldThrow) {
        throw PictureInPictureConfigurationException()
      }
    }
  }

  fun isPictureInPictureSupported(currentActivity: Activity): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && currentActivity.packageManager.hasSystemFeature(
      android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE
    )
  }
}
