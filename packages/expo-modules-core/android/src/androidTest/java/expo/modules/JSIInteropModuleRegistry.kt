package expo.modules

import expo.modules.kotlin.jni.JSIInteropModuleRegistry
import org.junit.Assert
import org.junit.Test
import java.text.ParseException

class JSIInteropModuleRegistry {
  @Test
  @Throws(ParseException::class)
  fun checks_is_so_files_were_loaded() {
    Assert.assertTrue(BuildConfig.WERE_SO_FILES_PACKAGED)
    JSIInteropModuleRegistry.Companion
  }
}
