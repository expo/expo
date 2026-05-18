package expo.modules.audio

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager

class RingerModeReceiver(private val onSilentMode: () -> Unit) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val ringerMode = intent.getIntExtra(AudioManager.EXTRA_RINGER_MODE, AudioManager.RINGER_MODE_NORMAL)
    if (ringerMode != AudioManager.RINGER_MODE_NORMAL) {
      onSilentMode()
    }
  }
}
