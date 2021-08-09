package expo.modules.speech

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.ModuleRegistryDelegate
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.EventEmitter
import org.unimodules.core.interfaces.services.UIManager
import java.util.*

class SpeechModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), LifecycleEventListener {

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val uiManager: UIManager by moduleRegistry()
  private val delayedUtterances: Queue<Map<String, Any?>> = ArrayDeque()

  // Module basic definitions

  override fun getName() = "ExponentSpeech"

  override fun getConstants() = mapOf(
    "maxSpeechInputLength" to TextToSpeech.getMaxSpeechInputLength()
  )

  // Module methods

  @ExpoMethod
  fun isSpeaking(promise: Promise) {
    promise.resolve(textToSpeech.isSpeaking)
  }

  @ExpoMethod
  fun getVoices(promise: Promise) {
    var nativeVoices: MutableList<Voice> = mutableListOf()
    try {
      nativeVoices = textToSpeech.voices.toMutableList()
    } catch (e: Exception) {
    }

    val voices = nativeVoices.map {
      var quality = "Default"
      if (it.quality > Voice.QUALITY_NORMAL) {
        quality = "Enhanced"
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
  fun speak(id: String?, text: String, options: Map<String, Any>?, promise: Promise) {
    if (text.length > TextToSpeech.getMaxSpeechInputLength()) {
      promise.reject(
        "ERR_SPEECH_INPUT_LENGTH",
        "Speech input text is too long! Limit of input length is: " + TextToSpeech.getMaxSpeechInputLength()
      )
      return
    }
    if (isTextToSpeechReady) {
      speakOut(id, text, options)
    } else {
      delayedUtterances.add(
        mapOf(
          "id" to id,
          "text" to text,
          "options" to options,
        )
      )
      // init TTS, speaking will be available only after onInit
      textToSpeech
    }
    promise.resolve(null)
  }

  private fun speakOut(id: String?, text: String?, options: Map<String, Any>?) {
    if (options?.containsKey("language") == true) {
      val locale = Locale(options["language"] as String)
      val languageAvailable = textToSpeech.isLanguageAvailable(locale)
      if (languageAvailable != TextToSpeech.LANG_MISSING_DATA &&
        languageAvailable != TextToSpeech.LANG_NOT_SUPPORTED
      ) {
        textToSpeech.language = locale
      } else {
        textToSpeech.language = Locale.getDefault()
      }
    } else {
      textToSpeech.language = Locale.getDefault()
    }
    if (options?.containsKey("pitch") == true) {
      textToSpeech.setPitch((options["pitch"] as Number).toFloat())
    }
    if (options?.containsKey("rate") == true) {
      textToSpeech.setSpeechRate((options["rate"] as Number).toFloat())
    }
    if (options?.containsKey("voice") == true) {
      for (voice in textToSpeech.voices) {
        if (voice.name == options["voice"]) {
          textToSpeech.voice = voice
          break
        }
      }
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
        // synchronize because in some cases this runs on another thread and mTTS is null
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
          for (arguments in delayedUtterances) {
            speakOut(
              arguments["id"] as String?,
              arguments["text"] as String?,
              arguments["options"] as Map<String, Any>?
            )
          }
        }
      }
    }
    _textToSpeech = newTtsInstance
    newTtsInstance
  }

  // Lifecycle methods

  override fun onHostResume() {}
  override fun onHostPause() {}
  override fun onHostDestroy() {
    textToSpeech.shutdown()
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    uiManager.registerLifecycleEventListener(this)
  }

  // Helpers

  private fun idToMap(id: String) = Bundle().apply {
    putString("id", id)
  }

  // do not refer to these - they're only needed when initializing `textTooSpeech`
  private var _textToSpeech: TextToSpeech? = null
  private var _ttsReady = false
}