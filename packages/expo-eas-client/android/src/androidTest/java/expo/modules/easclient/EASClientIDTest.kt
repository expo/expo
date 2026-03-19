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
  fun testUuidToIntervalKnownValue() {
    val uuid = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    val interval = EASClientID.uuidToInterval(uuid)
    // SHA-256 of UUID bytes, first 8 bytes as UInt64 big-endian / UInt64.MAX
    kotlin.test.assertEquals(0.9211200650509653, interval, 1e-15)
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
