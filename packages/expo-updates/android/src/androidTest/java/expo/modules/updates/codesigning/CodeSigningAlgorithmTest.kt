package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

@RunWith(AndroidJUnit4ClassRunner::class)
class CodeSigningAlgorithmTest {
  @Test
  fun test_parseFromString_ThrowsInvalidAlg() {
    val exception = assertFailsWith(
      exceptionClass = Exception::class,
      block = {
        CodeSigningAlgorithm.parseFromString("fake")
      }
    )
    assertEquals("Invalid code signing algorithm name: fake", exception.message)
  }
}
