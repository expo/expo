package expo.modules

import expo.modules.kotlin.jni.JSIInteropModuleRegistry
import org.junit.Assert
import org.junit.Test
import java.text.ParseException

class JSIInteropModuleRegistryTest {
  @Test
  @Throws(ParseException::class)
  fun ensure_static_libs_loaded() {
    try {
      // Using `JSIInteropModuleRegistry.Companion` ensures that static libs will be loaded.
      JSIInteropModuleRegistry.Companion
    } catch (e: Exception) {
      Assert.fail("Couldn't load the `expo-modules-core` library: $e.")
    }
  }
}
