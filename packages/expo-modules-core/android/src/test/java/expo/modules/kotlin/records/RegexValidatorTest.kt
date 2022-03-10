package expo.modules.kotlin.records

import expo.modules.assertNotNull
import expo.modules.assertNull
import org.junit.Test

class RegexValidatorTest {
  @Test
  fun `should not throw if a value match regex`() {
    val validator = RegexValidator("[a-d]*".toRegex())

    runCatching { validator.validate("aaaabbbbbccccddd") }.exceptionOrNull().assertNull()
  }

  @Test
  fun `should throw if a value not match regex`() {
    val validator = RegexValidator("[a-d]*".toRegex())

    runCatching { validator.validate("eeeeffff") }.exceptionOrNull().assertNotNull()
  }
}
