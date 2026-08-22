package expo.modules.easclient

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry.getInstrumentation
import org.amshove.kluent.shouldBe
import org.amshove.kluent.shouldBeEqualTo
import org.amshove.kluent.shouldBeGreaterOrEqualTo
import org.amshove.kluent.shouldBeLessThan
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
    // splitmix64(mostSignificantBits xor leastSignificantBits), scaled by 2^53.
    org.junit.Assert.assertEquals(0.5075081783308123, value, 1e-15)
  }

  @Test
  fun testDeterministicUniformValueRange() {
    val context = getInstrumentation().targetContext
    val value = EASClientID.deterministicUniformValue(EASClientID(context).uuid)
    value shouldBeGreaterOrEqualTo 0.0
    value shouldBeLessThan 1.0
  }

  @Test
  fun testDeterministicUniformValueDeterministic() {
    val uuid = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    EASClientID.deterministicUniformValue(uuid) shouldBeEqualTo EASClientID.deterministicUniformValue(uuid)
  }

  /**
   * A known-value test passes for any biased formula, so occupying the whole range is the
   * property that actually matters to callers comparing `value < threshold`.
   */
  @Test
  fun testDeterministicUniformValueIsUniformlyDistributed() {
    val occupiedDeciles =
      (0 until 2000)
        .map { seed ->
          val value = EASClientID.deterministicUniformValue(makeV4Uuid(seed.toLong()))

          value shouldBeGreaterOrEqualTo 0.0
          value shouldBeLessThan 1.0

          (value * 10).toInt()
        }
        .toSet()

    occupiedDeciles shouldBe (0 until 10).toSet()
  }

  @Test
  fun testUuidIsV4() {
    val context = getInstrumentation().targetContext
    val uuid = EASClientID(context).uuid
    uuid.version() shouldBeEqualTo 4
    uuid.variant() shouldBeEqualTo 2
  }

  /**
   * Builds RFC 4122 v4-shaped UUIDs from a seeded LCG so the distribution assertions are
   * reproducible rather than relying on random input.
   */
  private fun makeV4Uuid(seed: Long): UUID {
    var state = seed
    val bytes = ByteArray(16)
    for (index in bytes.indices) {
      state = state * 6364136223846793005L + 1442695040888963407L
      bytes[index] = (state ushr 33).toByte()
    }
    bytes[6] = ((bytes[6].toInt() and 0x0F) or 0x40).toByte() // version 4
    bytes[8] = ((bytes[8].toInt() and 0x3F) or 0x80).toByte() // variant 10

    var mostSignificantBits = 0L
    var leastSignificantBits = 0L
    for (index in 0 until 8) {
      mostSignificantBits = (mostSignificantBits shl 8) or (bytes[index].toLong() and 0xFF)
    }
    for (index in 8 until 16) {
      leastSignificantBits = (leastSignificantBits shl 8) or (bytes[index].toLong() and 0xFF)
    }
    return UUID(mostSignificantBits, leastSignificantBits)
  }
}
