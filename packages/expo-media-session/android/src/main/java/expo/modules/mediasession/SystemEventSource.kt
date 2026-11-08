package expo.modules.mediasession

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Build
import android.os.Handler

internal class SystemEventSource(
  private val context: Context,
  private val handler: Handler,
  private val coordinator: SessionCoordinator
) {
  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  private val noisyReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
        coordinator.onBecomingNoisy()
      }
    }
  }

  private val ringerModeReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      coordinator.onRingerModeChanged(
        intent.getIntExtra(AudioManager.EXTRA_RINGER_MODE, audioManager.ringerMode)
      )
    }
  }

  fun start() {
    coordinator.onRingerModeChanged(audioManager.ringerMode)
    register(noisyReceiver, AudioManager.ACTION_AUDIO_BECOMING_NOISY)
    register(ringerModeReceiver, AudioManager.RINGER_MODE_CHANGED_ACTION)
  }

  fun stop() {
    unregister(noisyReceiver)
    unregister(ringerModeReceiver)
  }

  private fun unregister(receiver: BroadcastReceiver) {
    try {
      context.unregisterReceiver(receiver)
    } catch (_: IllegalArgumentException) {
    }
  }

  // onReceive runs on the coordinator Handler.
  private fun register(receiver: BroadcastReceiver, action: String) {
    val filter = IntentFilter(action)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(receiver, filter, null, handler, Context.RECEIVER_NOT_EXPORTED)
    } else {
      context.registerReceiver(receiver, filter, null, handler)
    }
  }
}
