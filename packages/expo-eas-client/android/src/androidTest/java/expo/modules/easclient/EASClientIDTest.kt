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
  fun testUuidToIntervalBoundaries() {
    val zero = UUID.fromString("00000000-0000-0000-0000-000000000000")
    EASClientID.uuidToInterval(zero) shouldBeEqualTo 0.0

    val max = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff")
    EASClientID.uuidToInterval(max) shouldBeEqualTo 1.0
  }

  @Test
  fun testUuidToIntervalRange() {
    val context = getInstrumentation().targetContext
    val interval = EASClientID.uuidToInterval(EASClientID(context).uuid)
    interval shouldBeInRange 0.0..1.0
  }

  @Test
  fun testUuidToIntervalDeterministic() {
    val uuid = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    EASClientID.uuidToInterval(uuid) shouldBeEqualTo EASClientID.uuidToInterval(uuid)
  }
}
