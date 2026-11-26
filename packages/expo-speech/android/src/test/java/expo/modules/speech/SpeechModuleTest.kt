package expo.modules.speech

import android.speech.tts.TextToSpeech
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test
import java.util.Locale

class SpeechModuleTest {
  @Test
  fun malformedLanguageFallsBackToDefaultLocale() {
    val module = SpeechModule()
    val textToSpeech = mockk<TextToSpeech>(relaxed = true)

    setTextToSpeech(module, textToSpeech)

    speakOut(module, SpeechOptions("malformed", null, null, null, null))

    verify { textToSpeech.language = Locale.getDefault() }
  }

  @Test
  fun speaksWithVoiceWhenEngineReturnsNoVoices() {
    val module = SpeechModule()
    val textToSpeech = mockk<TextToSpeech>(relaxed = true)
    every { textToSpeech.voices } returns null

    setTextToSpeech(module, textToSpeech)

    speakOut(module, SpeechOptions(null, null, null, "voice", null))

    verify { textToSpeech.speak("text", TextToSpeech.QUEUE_ADD, any(), "id") }
  }

  private fun speakOut(module: SpeechModule, options: SpeechOptions) {
    SpeechModule::class.java.getDeclaredMethod(
      "speakOut",
      String::class.java,
      String::class.java,
      SpeechOptions::class.java
    ).apply { isAccessible = true }
      .invoke(module, "id", "text", options)
  }

  private fun setTextToSpeech(module: SpeechModule, textToSpeech: TextToSpeech) {
    SpeechModule::class.java.getDeclaredField("_textToSpeech")
      .apply { isAccessible = true }
      .set(module, textToSpeech)
  }
}
