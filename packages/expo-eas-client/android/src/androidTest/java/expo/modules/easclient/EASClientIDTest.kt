package expo.modules.easclient

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry.getInstrumentation
import org.amshove.kluent.shouldBeEqualTo
import org.amshove.kluent.shouldBeInRange
import org.amshove.kluent.shouldNotBe
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4ClassRunner::class)
class EASClientIDTest {
  @Test
  fun testCreatesStableUUID() {
    val context = getInstrumentation().targetContext
    val easClientId = EASClientID(context).uuid
    easClientId shouldNotBe null

    val easClientId2 = EASClientID(context).uuid
    easClientId shouldBeEqualTo easClientId2
  }

  @Test
  fun testDeterministicUniformValueKnownValue() {
    val uuid = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    val value = EASClientID.deterministicUniformValue(uuid)
    // leastSignificantBits (unsigned) = 0xABCDEF1234567890 / ULong.MAX
    org.junit.Assert.assertEquals(0.6711110515064663, value, 1e-15)
  }

  @Test
  fun testDeterministicUniformValueRange() {
    val context = getInstrumentation().targetContext
    val value = EASClientID.deterministicUniformValue(EASClientID(context).uuid)
    value shouldBeInRange 0.0..1.0
  }

  @Test
  fun testDeterministicUniformValueDeterministic() {
    val uuid = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    EASClientID.deterministicUniformValue(uuid) shouldBeEqualTo EASClientID.deterministicUniformValue(uuid)
  }

  @Test
  fun testUuidIsV4() {
    val context = getInstrumentation().targetContext
    val uuid = EASClientID(context).uuid
    uuid.version() shouldBeEqualTo 4
    uuid.variant() shouldBeEqualTo 2
  }
}
