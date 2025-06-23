package expo.modules.video

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.video.player.VideoPlayer
import expo.modules.video.utils.weakMutableHashSetOf
import java.lang.ref.WeakReference

// Helper class used to keep track of all existing VideoViews and VideoPlayers
@OptIn(UnstableApi::class)
object VideoManager {
  const val INTENT_PLAYER_KEY = "player_uuid"
  private var appContext: WeakReference<AppContext?> = WeakReference(null)

  // Used for sharing videoViews between VideoView and FullscreenPlayerActivity
  private var videoViews = mutableMapOf<String, VideoView>()
  private var fullscreenPlayerActivities = mutableMapOf<String, WeakReference<FullscreenPlayerActivity>>()

  // Keeps track of all existing VideoPlayers, and whether they are attached to a VideoView
  private var videoPlayersToVideoViews = mutableMapOf<VideoPlayer, MutableList<VideoView>>()

  private var playersRequestingKeepAwake = weakMutableHashSetOf<VideoPlayer>()

  private lateinit var audioFocusManager: AudioFocusManager
  lateinit var cache: VideoCache

  fun onModuleCreated(appContext: AppContext) {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    this.appContext = WeakReference(appContext)

    if (!this::audioFocusManager.isInitialized) {
      audioFocusManager = AudioFocusManager(appContext)
    }
    if (!this::cache.isInitialized) {
      cache = VideoCache(context)
    }
  }

  fun registerVideoView(videoView: VideoView) {
    videoViews[videoView.videoViewId] = videoView
  }

  fun getVideoView(id: String): VideoView {
    return videoViews[id] ?: throw VideoViewNotFoundException(id)
  }

  fun unregisterVideoView(videoView: VideoView) {
    videoViews.remove(videoView.videoViewId)
  }

  fun registerVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews[videoPlayer] = videoPlayersToVideoViews[videoPlayer] ?: mutableListOf()
    audioFocusManager.registerPlayer(videoPlayer)
  }

  fun unregisterVideoPlayer(videoPlayer: VideoPlayer) {
    videoPlayersToVideoViews.remove(videoPlayer)
    audioFocusManager.unregisterPlayer(videoPlayer)
  }

  fun registerFullscreenPlayerActivity(id: String, fullscreenActivity: FullscreenPlayerActivity) {
    fullscreenPlayerActivities[id] = WeakReference(fullscreenActivity)
  }

  fun unregisterFullscreenPlayerActivity(id: String) {
    fullscreenPlayerActivities.remove(id)
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

  fun requestKeepAwake(player: VideoPlayer) {
    playersRequestingKeepAwake.add(player)
    applyKeepAwake()
  }

  fun releaseKeepAwake(player: VideoPlayer) {
    playersRequestingKeepAwake.remove(player)
    applyKeepAwake()
  }

  fun isVideoPlayerAttachedToView(videoPlayer: VideoPlayer): Boolean {
    return videoPlayersToVideoViews[videoPlayer]?.isNotEmpty() ?: false
  }

  fun hasRegisteredPlayers(): Boolean {
    return videoPlayersToVideoViews.isNotEmpty()
  }

  fun onAppForegrounded() {
    for (videoView in videoViews.values) {
      videoView.playerView.useController = videoView.useNativeControls
    }

    // Pressing the app icon will bring up the mainActivity instead of the fullscreen activity (at least for BareExpo)
    // In this case we have to manually finish the fullscreen activity
    for (fullscreenActivity in fullscreenPlayerActivities.values) {
      fullscreenActivity.get()?.finish()
    }
  }

  fun onAppBackgrounded() {
    for (videoView in videoViews.values) {
      if (shouldPauseVideo(videoView)) {
        handleVideoPause(videoView)
      } else {
        videoView.wasAutoPaused = false
      }
    }
  }

  private fun applyKeepAwake() {
    // Setting `WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON` would've been more efficient, but
    // We can't be sure that it won't disable expo-keep-awake enabled when playersRequestingKeepAwake.size >= 1
    // once playersRequestingKeepAwake.size goes down to 0
    // It is safest to only set the flag to the video view.
    for (videoView in videoViews.values) {
      videoView.keepScreenOn = playersRequestingKeepAwake.isNotEmpty()
    }
  }

  private fun shouldPauseVideo(videoView: VideoView): Boolean {
    return videoView.videoPlayer?.staysActiveInBackground == false &&
      !videoView.willEnterPiP &&
      !videoView.isInFullscreen
  }

  private fun handleVideoPause(videoView: VideoView) {
    videoView.playerView.useController = false
    videoView.videoPlayer?.player?.let { player ->
      if (player.isPlaying) {
        player.pause()
        videoView.wasAutoPaused = true
      }
    }
  }
}
