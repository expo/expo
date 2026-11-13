package expo.modules.kotlin.exception

import com.google.common.truth.Truth
import io.github.expo.modules.v2.JavaScriptThrowable
import org.junit.Test

class CodedExceptionTest {
  class ModuleNotFoundException : CodedException()

  @Test
  fun `should be able to infer code from class name`() {
    val exception = ModuleNotFoundException()

    Truth.assertThat(exception.code).isEqualTo("ERR_MODULE_NOT_FOUND")
  }

  @Test
  fun `should report its code to Expo Modules v2`() {
    val provided: Throwable = CodedException("ERR_PROVIDED", "message", null)
    val inferred: Throwable = ModuleNotFoundException()

    Truth.assertThat((provided as? JavaScriptThrowable)?.code).isEqualTo("ERR_PROVIDED")
    Truth.assertThat((inferred as? JavaScriptThrowable)?.code).isEqualTo("ERR_MODULE_NOT_FOUND")
  }
}
