package expo.modules.speech

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import com.facebook.react.bridge.LifecycleEventListener
import io.github.expo.modules.v2.Constant
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.ArrayDeque
import java.util.IllformedLocaleException
import java.util.Locale
import java.util.Queue
import kotlin.coroutines.resume

const val speakingStartedEvent = "Exponent.speakingStarted"
const val speakingWillSayNextStringEvent = "Exponent.speakingWillSayNextString"
const val speakingDoneEvent = "Exponent.speakingDone"
const val speakingStoppedEvent = "Exponent.speakingStopped"
const val speakingErrorEvent = "Exponent.speakingError"

@ExpoModule("ExpoSpeech")
class SpeechModule : Module() {
  private val delayedUtterances: Queue<Utterance> = ArrayDeque()
  private val delayedGetVoices: Queue<CancellableContinuation<List<VoiceRecord>>> = ArrayDeque()
  private var ttsState = TtsState.PENDING

  @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
  private val queue = Dispatchers.IO.limitedParallelism(1)

  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() = Unit
    override fun onHostPause() = Unit
    override fun onHostDestroy() = textToSpeech.shutdown()
  }

  @Event(name = speakingStartedEvent)
  private val onSpeakingStarted = event<SpeechEvent>()

  @Event(name = speakingWillSayNextStringEvent)
  private val onSpeakingWillSayNextString = event<SpeechRangeEvent>()

  @Event(name = speakingDoneEvent)
  private val onSpeakingDone = event<SpeechEvent>()

  @Event(name = speakingStoppedEvent)
  private val onSpeakingStopped = event<SpeechEvent>()

  @Event(name = speakingErrorEvent)
  private val onSpeakingError = event<SpeechEvent>()

  @JS
  @Constant
  val maxSpeechInputLength: Int
    get() = TextToSpeech.getMaxSpeechInputLength()

  override fun onDestroy() {
    reactContextOrNull?.removeLifecycleEventListener(lifecycleListener)
  }

  @JS
  suspend fun isSpeaking(): Boolean = withContext(queue) {
    textToSpeech.isSpeaking
  }

  @JS
  suspend fun getVoices(): List<VoiceRecord> = withContext(queue) {
    when (ttsState) {
      TtsState.READY -> readVoices()
      TtsState.FAILED -> emptyList()
      TtsState.PENDING -> suspendCancellableCoroutine { continuation ->
        delayedGetVoices.add(continuation)

        // Init TTS, the promise will be fulfilled after onInit
        textToSpeech
      }
    }
  }

  @JS
  suspend fun stop(): Unit = withContext(queue) {
    textToSpeech.stop()
  }

  @JS
  suspend fun speak(id: String, text: String, options: SpeechOptions): Unit = withContext(queue) {
    if (text.length > TextToSpeech.getMaxSpeechInputLength()) {
      throw SpeechInputIsToLongException()
    }

    when (ttsState) {
      TtsState.READY -> speakOut(id, text, options)
      TtsState.FAILED -> onSpeakingError(SpeechEvent(id))
      TtsState.PENDING -> {
        delayedUtterances.add(Utterance(id, text, options))

        // init TTS, speaking will be available only after onInit
        textToSpeech
      }
    }
  }

  private fun readVoices(): List<VoiceRecord> {
    val nativeVoices = try {
      textToSpeech.voices.toList()
    } catch (err: Exception) {
      throw SpeechUnableToGetVoicesException(err)
    }

    return nativeVoices.map {
      val quality = if (it.quality > Voice.QUALITY_NORMAL) {
        VoiceQuality.ENHANCED
      } else {
        VoiceQuality.DEFAULT
      }

      VoiceRecord(
        identifier = it.name,
        name = it.name,
        quality = quality,
        language = LanguageUtils.getISOCode(it.locale)
      )
    }
  }

  private fun speakOut(id: String, text: String, options: SpeechOptions) {
    options.pitch?.let(textToSpeech::setPitch)
    options.rate?.let(textToSpeech::setSpeechRate)

    textToSpeech.language = options.language?.let {
      try {
        val locale = Locale.Builder().setLanguage(it).build()
        val languageAvailable = textToSpeech.isLanguageAvailable(locale)

        return@let if (
          languageAvailable != TextToSpeech.LANG_MISSING_DATA &&
          languageAvailable != TextToSpeech.LANG_NOT_SUPPORTED
        ) {
          locale
        } else {
          Locale.getDefault()
        }
      } catch (_: IllformedLocaleException) {
        Locale.getDefault()
      }
    } ?: Locale.getDefault()

    options.voice?.let { voiceName ->
      textToSpeech.voices
        .firstOrNull { it.name == voiceName }
        ?.let(textToSpeech::setVoice)
    }

    val params = Bundle().apply {
      options.volume?.let {
        val volume = it.coerceAtLeast(0.0f).coerceAtMost(1.0f)
        putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume)
      }
    }

    textToSpeech.speak(
      text,
      TextToSpeech.QUEUE_ADD,
      params,
      id
    )
  }

  // TextToSpeech object related code

  private val textToSpeech: TextToSpeech by lazy {
    val newTtsInstance = TextToSpeech(androidContext) { status: Int ->
      if (status == TextToSpeech.SUCCESS) {
        // synchronize because in some cases this runs on another thread and _textToSpeech is null
        synchronized(this@SpeechModule) {
          ttsState = TtsState.READY
          _textToSpeech!!.setOnUtteranceProgressListener(object : UtteranceProgressListener() {

            override fun onStart(utteranceId: String) {
              onSpeakingStarted(SpeechEvent(utteranceId))
            }

            override fun onRangeStart(utteranceId: String, start: Int, end: Int, frame: Int) {
              onSpeakingWillSayNextString(
                SpeechRangeEvent(
                  id = utteranceId,
                  charIndex = start,
                  charLength = end - start
                )
              )
            }

            override fun onDone(utteranceId: String) {
              onSpeakingDone(SpeechEvent(utteranceId))
            }

            override fun onStop(utteranceId: String, interrupted: Boolean) {
              onSpeakingStopped(SpeechEvent(utteranceId))
            }

            override fun onError(utteranceId: String) {
              onSpeakingError(SpeechEvent(utteranceId))
            }
          })
          for ((id, text, options) in delayedUtterances) {
            speakOut(id, text, options)
          }
          for (continuation in delayedGetVoices) {
            continuation.resumeWith(runCatching { readVoices() })
          }
        }
      } else {
        synchronized(this@SpeechModule) {
          ttsState = TtsState.FAILED
          delayedGetVoices.forEach { it.resume(emptyList()) }
          delayedUtterances.forEach { onSpeakingError(SpeechEvent(it.id)) }
        }
      }
    }
    _textToSpeech = newTtsInstance
    reactContextOrNull?.addLifecycleEventListener(lifecycleListener)
    newTtsInstance
  }

  private data class Utterance(
    val id: String,
    val text: String,
    val options: SpeechOptions
  )

  private enum class TtsState {
    PENDING,
    READY,
    FAILED
  }

  // do not refer to this - it's only needed when initializing `textToSpeech`
  private var _textToSpeech: TextToSpeech? = null
}
