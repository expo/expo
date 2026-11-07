package expo.modules.mediasession

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Handler

internal enum class FocusResult { GRANTED, DELAYED }

internal interface SessionBackend {
  fun requestFocus(spec: FocusSpec): FocusResult
  fun abandonFocus()
}

internal class AudioManagerBackend(context: Context, private val handler: Handler) : SessionBackend {
  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private var request: AudioFocusRequest? = null
  private var holdsLegacyFocus = false

  var onFocusChange: (Int) -> Unit = {}

  private val listener = AudioManager.OnAudioFocusChangeListener { onFocusChange(it) }

  override fun requestFocus(spec: FocusSpec): FocusResult {
    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val newRequest = AudioFocusRequest.Builder(spec.gain)
        .setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(spec.usage)
            .setContentType(spec.contentType)
            .build()
        )
        .setAcceptsDelayedFocusGain(spec.acceptsDelayedFocusGain)
        .setWillPauseWhenDucked(spec.pausesWhenDucked)
        .setOnAudioFocusChangeListener(listener, handler)
        .build()
      audioManager.requestAudioFocus(newRequest).also {
        if (it != AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
          request = newRequest
        }
      }
    } else {
      val stream = if (spec.usage == AudioAttributes.USAGE_VOICE_COMMUNICATION) {
        AudioManager.STREAM_VOICE_CALL
      } else {
        AudioManager.STREAM_MUSIC
      }
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(listener, stream, spec.gain).also {
        if (it != AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
          holdsLegacyFocus = true
        }
      }
    }
    return when (result) {
      AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> FocusResult.GRANTED
      AudioManager.AUDIOFOCUS_REQUEST_DELAYED -> FocusResult.DELAYED
      else -> throw IllegalStateException("AudioManager.requestAudioFocus returned AUDIOFOCUS_REQUEST_FAILED")
    }
  }

  override fun abandonFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      request?.let { audioManager.abandonAudioFocusRequest(it) }
      request = null
    } else if (holdsLegacyFocus) {
      @Suppress("DEPRECATION")
      audioManager.abandonAudioFocus(listener)
      holdsLegacyFocus = false
    }
  }
}
