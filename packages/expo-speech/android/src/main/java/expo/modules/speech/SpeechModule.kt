package expo.modules.speech

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.ArrayDeque
import java.util.Locale
import java.util.Queue

const val speakingStartedEvent = "Exponent.speakingStarted"
const val speakingWillSayNextStringEvent = "Exponent.speakingWillSayNextString"
const val speakingDoneEvent = "Exponent.speakingDone"
const val speakingStoppedEvent = "Exponent.speakingStopped"
const val speakingErrorEvent = "Exponent.speakingError"

class SpeechModule : Module() {
  private val delayedUtterances: Queue<Utterance> = ArrayDeque()

  override fun definition() = ModuleDefinition {
    Name("ExpoSpeech")

    Events(
      speakingStartedEvent,
      speakingWillSayNextStringEvent,
      speakingDoneEvent,
      speakingStoppedEvent,
      speakingErrorEvent
    )

    Constants("maxSpeechInputLength" to TextToSpeech.getMaxSpeechInputLength())

    OnActivityDestroys {
      textToSpeech.shutdown()
    }

    AsyncFunction<Boolean>("isSpeaking") {
      textToSpeech.isSpeaking
    }

    AsyncFunction<List<VoiceRecord>>("getVoices") {
      val nativeVoices = try {
        textToSpeech.voices.toList()
      } catch (_: Exception) {
        emptyList()
      }

      return@AsyncFunction nativeVoices.map {
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

    AsyncFunction<Unit>("stop") {
      textToSpeech.stop()
    }

    AsyncFunction("speak") { id: String, text: String, options: SpeechOptions ->
      if (text.length > TextToSpeech.getMaxSpeechInputLength()) {
        throw SpeechInputIsToLongException()
      }

      if (isTextToSpeechReady) {
        speakOut(id, text, options)
      } else {
        delayedUtterances.add(Utterance(id, text, options))

        // init TTS, speaking will be available only after onInit
        textToSpeech
      }
      Unit
    }
  }

  private fun speakOut(id: String, text: String, options: SpeechOptions) {
    options.pitch?.let(textToSpeech::setPitch)
    options.rate?.let(textToSpeech::setSpeechRate)

    textToSpeech.language = options.language?.let {
      val locale = Locale(it)
      val languageAvailable = textToSpeech.isLanguageAvailable(locale)

      return@let if (
        languageAvailable != TextToSpeech.LANG_MISSING_DATA &&
        languageAvailable != TextToSpeech.LANG_NOT_SUPPORTED
      ) {
        locale
      } else {
        Locale.getDefault()
      }
    } ?: Locale.getDefault()

    options.voice?.let { voiceName ->
      textToSpeech.voices
        .firstOrNull { it.name == voiceName }
        ?.let(textToSpeech::setVoice)
    }

    textToSpeech.speak(
      text,
      TextToSpeech.QUEUE_ADD,
      null,
      id
    )
  }

  // TextToSpeech object related code

  private val isTextToSpeechReady
    get() = _ttsReady

  private val textToSpeech: TextToSpeech by lazy {
    val newTtsInstance = TextToSpeech(appContext.reactContext) { status: Int ->
      if (status == TextToSpeech.SUCCESS) {
        // synchronize because in some cases this runs on another thread and _textToSpeech is null
        synchronized(this@SpeechModule) {
          _ttsReady = true
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
            speakOut(id, text, options)
          }
        }
      }
    }
    _textToSpeech = newTtsInstance
    newTtsInstance
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

  // do not refer to these - they're only needed when initializing `textToSpeech`
  private var _textToSpeech: TextToSpeech? = null
  private var _ttsReady = false
}
