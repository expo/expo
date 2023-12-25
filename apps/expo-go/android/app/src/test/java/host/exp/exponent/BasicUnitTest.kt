package host.exp.exponent

import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnit
import org.mockito.junit.MockitoRule
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class BasicUnitTest {
  @Rule
  @JvmField
  val rule: MockitoRule = MockitoJUnit.rule()

  @Test
  fun basicTest() {
    Assert.assertTrue(true)
  }
}
