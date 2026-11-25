package expo.modules.speech

import android.speech.tts.TextToSpeech
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
    val delegate = SpeechModule::class.java.getDeclaredField("textToSpeech\$delegate")
      .apply { isAccessible = true }
      .get(module)
    delegate.javaClass.getDeclaredField("_value")
      .apply { isAccessible = true }
      .set(delegate, textToSpeech)
  }
}
