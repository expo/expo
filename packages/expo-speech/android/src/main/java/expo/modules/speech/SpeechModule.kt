package expo.modules.speech

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.ArrayDeque
import java.util.IllformedLocaleException
import java.util.Locale
import java.util.Queue

const val speakingStartedEvent = "Exponent.speakingStarted"
const val speakingWillSayNextStringEvent = "Exponent.speakingWillSayNextString"
const val speakingDoneEvent = "Exponent.speakingDone"
const val speakingStoppedEvent = "Exponent.speakingStopped"
const val speakingErrorEvent = "Exponent.speakingError"

class SpeechModule : Module() {
  private val delayedUtterances: Queue<Utterance> = ArrayDeque()
  private val delayedGetVoices: Queue<Promise> = ArrayDeque()
  private var ttsState = TtsState.PENDING

  override fun definition() = ModuleDefinition {
    Name("ExpoSpeech")

    Events(
      speakingStartedEvent,
      speakingWillSayNextStringEvent,
      speakingDoneEvent,
      speakingStoppedEvent,
      speakingErrorEvent
    )

    Constant("maxSpeechInputLength") {
      TextToSpeech.getMaxSpeechInputLength()
    }

    OnActivityDestroys {
      resetTextToSpeech()
    }

    AsyncFunction<Boolean>("isSpeaking") {
      textToSpeech.isSpeaking
    }

    AsyncFunction("getVoices") { promise: Promise ->
      when (ttsState) {
        TtsState.READY -> promise.resolve(getVoices())
        TtsState.FAILED -> promise.resolve(emptyList<VoiceRecord>())
        TtsState.PENDING -> {
          delayedGetVoices.add(promise)

          // Init TTS, the promise will be fulfilled after onInit
          textToSpeech
        }
      }
    }

    AsyncFunction<Unit>("stop") {
      textToSpeech.stop()
    }

    AsyncFunction("speak") { id: String, text: String, options: SpeechOptions ->
      if (text.length > TextToSpeech.getMaxSpeechInputLength()) {
        throw SpeechInputIsToLongException()
      }

      when (ttsState) {
        TtsState.READY -> if (speakOut(id, text, options) == TextToSpeech.ERROR) {
          // The engine died and TextToSpeech never reconnects, so retry with a new instance
          resetTextToSpeech()
          delayedUtterances.add(Utterance(id, text, options))
          textToSpeech
        }
        TtsState.FAILED -> sendEvent(speakingErrorEvent, idToMap(id))
        TtsState.PENDING -> {
          delayedUtterances.add(Utterance(id, text, options))

          // init TTS, speaking will be available only after onInit
          textToSpeech
        }
      }
      Unit
    }
  }

  private fun getVoices(): List<VoiceRecord> {
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

  private fun speakOut(id: String, text: String, options: SpeechOptions): Int {
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
        ?.firstOrNull { it.name == voiceName }
        ?.let(textToSpeech::setVoice)
    }

    val params = Bundle().apply {
      options.volume?.let {
        val volume = it.coerceAtLeast(0.0f).coerceAtMost(1.0f)
        putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume)
      }
    }

    return textToSpeech.speak(
      text,
      TextToSpeech.QUEUE_ADD,
      params,
      id
    )
  }

  // TextToSpeech object related code

  private val textToSpeech: TextToSpeech
    get() = synchronized(this) { _textToSpeech ?: createTextToSpeech() }

  private fun resetTextToSpeech() {
    val oldTtsInstance = synchronized(this) {
      ttsState = TtsState.PENDING
      ttsGeneration++
      _textToSpeech.also { _textToSpeech = null }
    }
    // Called outside the lock to avoid a deadlock with the init callback
    oldTtsInstance?.shutdown()
  }

  private fun createTextToSpeech(): TextToSpeech {
    val generation = ttsGeneration
    val newTtsInstance = TextToSpeech(appContext.reactContext) { status: Int ->
      if (status == TextToSpeech.SUCCESS) {
        // synchronize because in some cases this runs on another thread and _textToSpeech is null
        synchronized(this@SpeechModule) {
          // Ignore a late callback from an instance that was already reset
          if (generation != ttsGeneration) {
            return@synchronized
          }
          ttsState = TtsState.READY
          _textToSpeech!!.setOnUtteranceProgressListener(object : UtteranceProgressListener() {

            override fun onStart(utteranceId: String) {
              sendEvent(speakingStartedEvent, idToMap(utteranceId))
            }

            override fun onRangeStart(utteranceId: String, start: Int, end: Int, frame: Int) {
              val map = Bundle().apply {
                putString("id", utteranceId)
                putInt("charIndex", start)
                putInt("charLength", end - start)
              }
              sendEvent(speakingWillSayNextStringEvent, map)
            }

            override fun onDone(utteranceId: String) {
              sendEvent(speakingDoneEvent, idToMap(utteranceId))
            }

            override fun onStop(utteranceId: String, interrupted: Boolean) {
              sendEvent(speakingStoppedEvent, idToMap(utteranceId))
            }

            override fun onError(utteranceId: String) {
              sendEvent(speakingErrorEvent, idToMap(utteranceId))
            }
          })
          for ((id, text, options) in delayedUtterances) {
            if (speakOut(id, text, options) == TextToSpeech.ERROR) {
              sendEvent(speakingErrorEvent, idToMap(id))
            }
          }
          for (promise in delayedGetVoices) {
            promise.resolve(getVoices())
          }
          delayedUtterances.clear()
          delayedGetVoices.clear()
        }
      } else {
        synchronized(this@SpeechModule) {
          if (generation != ttsGeneration) {
            return@synchronized
          }
          ttsState = TtsState.FAILED
          delayedGetVoices.forEach { it.resolve(emptyList<VoiceRecord>()) }
          delayedUtterances.forEach { sendEvent(speakingErrorEvent, idToMap(it.id)) }
          delayedUtterances.clear()
          delayedGetVoices.clear()
        }
      }
    }
    _textToSpeech = newTtsInstance
    return newTtsInstance
  }

  // Helpers
  private fun idToMap(id: String) = Bundle().apply {
    putString("id", id)
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

  // use the `textToSpeech` getter instead, it creates the instance when needed
  private var _textToSpeech: TextToSpeech? = null
  private var ttsGeneration = 0
}
