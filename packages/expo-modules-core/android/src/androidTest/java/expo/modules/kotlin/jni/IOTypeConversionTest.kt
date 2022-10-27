@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test
import java.io.File
import java.nio.file.Path

class IOTypeConversionTest {
  @Test
  fun file_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("file") { a: File -> a.toString() }
    }
  ) {
    val stringValue = evaluateScript("expo.modules.TestModule.file('/path/to/file')").getString()
    Truth.assertThat(stringValue).isEqualTo("/path/to/file")
  }

  @Test
  fun path_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("path") { a: Path -> a.toString() }
    }
  ) {
    val stringValue = evaluateScript("expo.modules.TestModule.path('/path/to/file')").getString()
    Truth.assertThat(stringValue).isEqualTo("/path/to/file")
  }
}
