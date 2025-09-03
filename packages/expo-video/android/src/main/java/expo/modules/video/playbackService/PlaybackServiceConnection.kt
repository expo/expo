package expo.modules.video.playbackService

import android.content.ComponentName
import android.content.ServiceConnection
import android.os.IBinder
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.video.getPlaybackServiceErrorMessage
import expo.modules.video.player.VideoPlayer
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class PlaybackServiceConnection(val player: WeakReference<VideoPlayer>, appContext: AppContext) : ServiceConnection {
  var playbackServiceBinder: PlaybackServiceBinder? = null
    private set
  var isConnected = false
    private set
  private val _appContext = WeakReference(appContext)
  private val appContext: AppContext
    get() = _appContext.get() ?: throw Exceptions.AppContextLost()

  override fun onServiceConnected(componentName: ComponentName, binder: IBinder) {
    val player = player.get() ?: return
    val serviceBinder: PlaybackServiceBinder = binder as? PlaybackServiceBinder ?: run {
      appContext.jsLogger?.error(
        getPlaybackServiceErrorMessage("Expo-video could not bind to the playback service")
      )
      return
    }

    isConnected = true
    playbackServiceBinder = serviceBinder
    serviceBinder.service.appContext = appContext
    serviceBinder.service.registerPlayer(player)
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    playbackServiceBinder = null
    isConnected = false
  }

  override fun onBindingDied(name: ComponentName?) {
    isConnected = false
    appContext.jsLogger?.error(
      getPlaybackServiceErrorMessage(
        "Expo-video has lost connection to the playback service binder",
        "This will cause issues with now playing notification and sustaining background playback."
      )
    )
    super.onBindingDied(name)
  }

  override fun onNullBinding(componentName: ComponentName) {
    isConnected = false
    appContext.jsLogger?.error(
      getPlaybackServiceErrorMessage("Expo Video could not bind to the playback service")
    )
    super.onNullBinding(componentName)
  }
}
