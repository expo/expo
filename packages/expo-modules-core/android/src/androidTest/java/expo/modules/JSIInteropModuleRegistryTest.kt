package expo.modules

import expo.modules.kotlin.jni.JSIInteropModuleRegistry
import org.junit.Assert
import org.junit.Test
import java.text.ParseException

class JSIInteropModuleRegistryTest {
  @Test
  @Throws(ParseException::class)
  fun checks_is_so_files_were_loaded() {
    try {
      // By using `JSIInteropModuleRegistry.Companion`, we ensure that so files will be loaded.
      JSIInteropModuleRegistry.Companion
    } catch (e: Exception) {
      Assert.fail("Couldn't load the `expo-modules-core` library: $e.")
    }
  }
}
