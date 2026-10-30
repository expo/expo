package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.junit.Test

private class AudioModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioModule")
    Constant("isAudioModule") { true }
  }
}

private class AudioPlayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioPlayerModule")
    Class("AudioPlayer")
    // Clashes with the `Audio` module, so it is not available in the package.
    Class("Audio")
  }
}

private class Audio : Module() {
  override fun definition() = ModuleDefinition {
    Name("Audio")
  }
}

class JSIPackagesTest {
  private inline fun withPackage(crossinline block: JSIContext.() -> Unit) =
    withJSIInterop(AudioModule(), AudioPlayerModule(), Audio(), packageName = "expo-audio") { block() }

  private fun JSIContext.evaluateBoolean(script: String) = evaluateScript(script).getBool()

  @Test
  fun package_should_be_defined() = withPackage {
    Truth.assertThat(evaluateScript("typeof expo.packages['expo-audio']").getString()).isEqualTo("object")
    Truth.assertThat(evaluateBoolean("expo.packages['expo-video'] === undefined")).isTrue()
  }

  @Test
  fun module_names_should_still_work() = withPackage {
    Truth.assertThat(evaluateBoolean("expo.modules.AudioModule.isAudioModule")).isTrue()
    Truth.assertThat(evaluateBoolean("expo.modules['expo-audio'] === undefined")).isTrue()
  }

  @Test
  fun package_should_return_the_same_object() = withPackage {
    Truth.assertThat(evaluateBoolean("expo.packages['expo-audio'] === expo.packages['expo-audio']")).isTrue()
  }

  @Test
  fun package_should_return_the_module_object() = withPackage {
    Truth.assertThat(evaluateBoolean("expo.packages['expo-audio'].AudioModule === expo.modules.AudioModule")).isTrue()
  }

  @Test
  fun package_should_return_the_class_from_the_module_object() = withPackage {
    Truth.assertThat(
      evaluateBoolean("expo.packages['expo-audio'].AudioPlayer === expo.modules.AudioPlayerModule.AudioPlayer")
    ).isTrue()
  }

  @Test
  fun module_should_take_precedence_over_class_with_the_same_name() = withPackage {
    Truth.assertThat(evaluateBoolean("expo.packages['expo-audio'].Audio === expo.modules.Audio")).isTrue()
  }

  @Test
  fun package_should_list_its_modules_and_classes() = withPackage {
    Truth.assertThat(evaluateScript("Object.keys(expo.packages['expo-audio']).join(',')").getString())
      .isEqualTo("Audio,AudioModule,AudioPlayerModule,AudioPlayer")
  }

  @Test
  fun package_should_return_undefined_for_unknown_names() = withPackage {
    Truth.assertThat(evaluateBoolean("expo.packages['expo-audio'].Unknown === undefined")).isTrue()
  }
}
