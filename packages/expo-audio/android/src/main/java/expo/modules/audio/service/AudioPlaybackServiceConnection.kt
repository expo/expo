package expo.modules.audio.service

import android.content.ComponentName
import android.os.IBinder
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSessionService.SERVICE_INTERFACE
import expo.modules.audio.AudioPlayer
import expo.modules.audio.getPlaybackServiceErrorMessage
import expo.modules.kotlin.AppContext
import java.lang.ref.WeakReference

class AudioPlaybackServiceBinder(val service: AudioControlsService) : android.os.Binder()

@OptIn(UnstableApi::class)
class AudioPlaybackServiceConnection(
  val player: WeakReference<AudioPlayer>,
  appContext: AppContext
) : BaseServiceConnection<AudioPlaybackServiceBinder>(appContext) {
  var playbackServiceBinder: AudioPlaybackServiceBinder? = null
    private set

  @Volatile
  private var isReleased = false

  fun release() {
    isReleased = true
  }

  fun bindWithService() {
    if (bindingState == ServiceBindingState.BOUND || bindingState == ServiceBindingState.BINDING || bindingState == ServiceBindingState.UNBINDING) {
      return
    }

    if (bindingState == ServiceBindingState.UNBOUND || bindingState == ServiceBindingState.FAILED) {
      val reactContext = appContext.reactContext ?: run {
        onBindingFailed("Binding with the expo-audio playback service failed: React context lost")
        return
      }
      val serviceStarted = startServiceAndBind(appContext, reactContext, this, AudioControlsService::class.java, SERVICE_INTERFACE)

      if (!serviceStarted) {
        onBindingFailed("Failed to start the expo-audio playback service.")
        return
      }

      transitionToState(ServiceBindingState.BINDING)
    }
  }

  override fun onServiceConnected(componentName: ComponentName, binder: IBinder) {
    val player = player.get()
    if (player == null || isReleased) {
      transitionToState(ServiceBindingState.FAILED)
      return
    }

    val serviceBinder: AudioPlaybackServiceBinder = binder as? AudioPlaybackServiceBinder ?: run {
      onBindingFailed("Could not bind to the playback service - invalid binder type")
      transitionToState(ServiceBindingState.FAILED)
      return
    }

    transitionToState(ServiceBindingState.BOUND)

    playbackServiceBinder = serviceBinder
    serviceBinder.service.appContext = appContext

    if (player.isActiveForLockScreen) {
      serviceBinder.service.setPlayerOptions(player, player.metadata, player.lockScreenOptions)
    }
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    playbackServiceBinder?.service?.let { service ->
      service.playbackListener?.let { listener ->
        val player = player.get()
        if (player != null && !isReleased) {
          player.ref.removeListener(listener)
        }
      }
      service.playbackListener = null
    }

    playbackServiceBinder = null
    super.onServiceDisconnected(componentName)
  }

  override fun onServiceDied() {
    super.onServiceDied()
  }

  override fun onServiceConnectedInternal(binder: AudioPlaybackServiceBinder) {
    // NOOP
  }

  override fun getServiceErrorMessage(message: String): String {
    return getPlaybackServiceErrorMessage(message)
  }
}
