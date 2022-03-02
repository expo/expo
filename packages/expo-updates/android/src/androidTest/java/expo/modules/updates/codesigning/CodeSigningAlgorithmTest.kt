package expo.modules.updates.codesigning

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class CodeSigningAlgorithmTest {
  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun test_parseFromString_ThrowsInvalidAlg() {
    CodeSigningAlgorithm.parseFromString("fake")
  }
}
