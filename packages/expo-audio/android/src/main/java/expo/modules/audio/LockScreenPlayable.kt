package expo.modules.audio

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import expo.modules.audio.service.AudioPlaybackServiceConnection
import expo.modules.audio.service.ServiceBindingState

@OptIn(UnstableApi::class)
interface LockScreenPlayable : Playable {
  var isActiveForLockScreen: Boolean
  var metadata: Metadata?
  var lockScreenOptions: AudioLockScreenOptions?
  var mediaSession: MediaSession
  val serviceConnection: AudioPlaybackServiceConnection
  val isLive: Boolean
    get() = player.isCurrentMediaItemLive
  val supportsNextTrack: Boolean
    get() = false
  val supportsPreviousTrack: Boolean
    get() = false

  fun assignBasicMediaSession()

  fun nextTrack() = Unit

  fun previousTrack() = Unit

  fun setActiveForLockScreen(
    active: Boolean,
    metadata: Metadata? = null,
    options: AudioLockScreenOptions? = null
  ) {
    if (active) {
      this.metadata = metadata
      this.lockScreenOptions = options
      this.isActiveForLockScreen = true

      if (serviceConnection.bindingState == ServiceBindingState.UNBOUND) {
        serviceConnection.bindWithService()
      }

      val serviceBinder = serviceConnection.playbackServiceBinder
      if (serviceBinder != null && serviceConnection.bindingState == ServiceBindingState.BOUND) {
        serviceBinder.service.setPlayableOptions(this, metadata, options)
      } else if (serviceConnection.bindingState != ServiceBindingState.BINDING) {
        appContext?.jsLogger?.error(
          getPlaybackServiceErrorMessage("Failed to activate lock screen controls - service binding failed")
        )
      }
    } else if (isActiveForLockScreen) {
      this.isActiveForLockScreen = false
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayable()
    }
  }

  fun updateLockScreenMetadata(metadata: Metadata) {
    if (isActiveForLockScreen) {
      this.metadata = metadata

      val serviceBinder = serviceConnection.playbackServiceBinder
      if (serviceBinder != null && serviceConnection.bindingState == ServiceBindingState.BOUND) {
        serviceBinder.service.setPlayableMetadata(this, metadata)
      } else {
        appContext?.jsLogger?.warn(
          getPlaybackServiceErrorMessage("Cannot update lock screen metadata - service not connected")
        )
      }
    }
  }

  fun clearLockScreenControls() {
    if (isActiveForLockScreen) {
      isActiveForLockScreen = false
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayable()
    }
  }
}
