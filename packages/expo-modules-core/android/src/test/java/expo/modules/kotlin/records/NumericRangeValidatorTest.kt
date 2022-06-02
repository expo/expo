package expo.modules.kotlin.records

import expo.modules.assertNotNull
import expo.modules.assertNull
import org.junit.Test

class NumericRangeValidatorTest {
  @Test
  fun `should not throw if an argument is in the range`() {
    val validator = NumericRangeValidator(1, 10, fromInclusive = true, toInclusive = true)

    runCatching { validator.validate(1) }.exceptionOrNull().assertNull()
    runCatching { validator.validate(5) }.exceptionOrNull().assertNull()
    runCatching { validator.validate(10) }.exceptionOrNull().assertNull()
  }

  @Test
  fun `should throw if an argument is outside of the range`() {
    val validator1 = NumericRangeValidator(1, 10, fromInclusive = false, toInclusive = true)
    val validator2 = NumericRangeValidator(1, 10, fromInclusive = true, toInclusive = false)
    val validator3 = NumericRangeValidator(1, 10, fromInclusive = false, toInclusive = false)

    runCatching { validator1.validate(1) }.exceptionOrNull().assertNotNull()
    runCatching { validator1.validate(11) }.exceptionOrNull().assertNotNull()

    runCatching { validator2.validate(0) }.exceptionOrNull().assertNotNull()
    runCatching { validator2.validate(10) }.exceptionOrNull().assertNotNull()

    runCatching { validator3.validate(1) }.exceptionOrNull().assertNotNull()
    runCatching { validator3.validate(10) }.exceptionOrNull().assertNotNull()
  }
}
