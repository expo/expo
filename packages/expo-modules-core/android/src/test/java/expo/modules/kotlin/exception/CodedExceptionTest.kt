package expo.modules.kotlin.exception

import com.google.common.truth.Truth
import org.junit.Test

class CodedExceptionTest {
  class ModuleNotFoundException : CodedException()

  @Test
  fun `should be able to infer code from class name`() {
    val exception = ModuleNotFoundException()

    Truth.assertThat(exception.code).isEqualTo("ERR_MODULE_NOT_FOUND")
  }
}
