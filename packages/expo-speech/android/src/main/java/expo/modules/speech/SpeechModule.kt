package expo.modules.speech

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.core.interfaces.services.UIManager
import java.util.*

class SpeechModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), LifecycleEventListener {

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val uiManager: UIManager by moduleRegistry()
  private val delayedUtterances: Queue<Utterance> = ArrayDeque()

  // Module basic definitions
  override fun getName() = "ExponentSpeech"
  override fun getConstants() = mapOf(
    "maxSpeechInputLength" to TextToSpeech.getMaxSpeechInputLength()
  )

  // Module methods

  @ExpoMethod
  fun isSpeaking(promise: Promise) = promise.resolve(textToSpeech.isSpeaking)

  @ExpoMethod
  fun getVoices(promise: Promise) {
    var nativeVoices: List<Voice> = emptyList()
    try {
      nativeVoices = textToSpeech.voices.toList()
    } catch (e: Exception) {}

    val voices = nativeVoices.map {
      val quality = if (it.quality > Voice.QUALITY_NORMAL) {
        "Enhanced"
      } else {
        "Default"
      }

      Bundle().apply {
        putString("identifier", it.name)
        putString("name", it.name)
        putString("quality", quality)
        putString("language", LanguageUtils.getISOCode(it.locale))
      }
    }

    promise.resolve(voices)
  }

  @ExpoMethod
  fun stop(promise: Promise) {
    textToSpeech.stop()
    promise.resolve(null)
  }

  @ExpoMethod
  fun speak(id: String, text: String, options: Map<String, Any>?, promise: Promise) {
    val speechOptions = SpeechOptions.optionsFromMap(options, promise) ?: return

    if (text.length > TextToSpeech.getMaxSpeechInputLength()) {
      promise.reject(
        "ERR_SPEECH_INPUT_LENGTH",
        "Speech input text is too long! Limit of input length is: " + TextToSpeech.getMaxSpeechInputLength()
      )
      return
    }

    if (isTextToSpeechReady) {
      speakOut(id, text, speechOptions)
    } else {
      delayedUtterances.add(Utterance(id, text, speechOptions))

      // init TTS, speaking will be available only after onInit
      textToSpeech
    }
    promise.resolve(null)
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
    val newTtsInstance = TextToSpeech(context) { status: Int ->
      if (status == TextToSpeech.SUCCESS) {
        // synchronize because in some cases this runs on another thread and _textToSpeech is null
        synchronized(this@SpeechModule) {
          _ttsReady = true
          _textToSpeech!!.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            private val emitter by moduleRegistry<EventEmitter>()

            override fun onStart(utteranceId: String) {
              emitter.emit("Exponent.speakingStarted", idToMap(utteranceId))
            }

            override fun onDone(utteranceId: String) {
              emitter.emit("Exponent.speakingDone", idToMap(utteranceId))
            }

            override fun onStop(utteranceId: String, interrupted: Boolean) {
              emitter.emit("Exponent.speakingStopped", idToMap(utteranceId))
            }

            override fun onError(utteranceId: String) {
              emitter.emit("Exponent.speakingError", idToMap(utteranceId))
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

  // Lifecycle methods
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    uiManager.registerLifecycleEventListener(this)
  }
  override fun onHostPause() {}
  override fun onHostResume() {}
  override fun onHostDestroy() {
    textToSpeech.shutdown()
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
