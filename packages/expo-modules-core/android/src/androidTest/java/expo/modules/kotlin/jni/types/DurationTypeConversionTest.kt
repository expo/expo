package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import org.junit.Test
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class DurationTypeConversionTest {
  @Test
  fun should_convert_from_double() = conversionTest<Duration, Long>(
    jsValue = "10.0",
    nativeAssertion = { duration: Duration ->
      Truth.assertThat(duration.inWholeSeconds).isEqualTo(10)
    },
    map = { duration: Duration ->
      duration.inWholeMicroseconds
    },
    jsAssertion = JSAssertion.IntEqual(10_000_000)
  )

  @Test
  fun should_convert_to_double() = conversionTest<Duration>(
    jsValue = "10.0",
    nativeAssertion = { duration: Duration ->
      Truth.assertThat(duration.inWholeSeconds).isEqualTo(10)
    },
    jsAssertion = JSAssertion.DoubleEqual(10.0)
  )

  @Test
  fun should_convert_back() = conversionTest<Duration>(
    jsValue = "10.0",
    nativeAssertion = { duration: Duration ->
      Truth.assertThat(duration.inWholeSeconds).isEqualTo(10)
      10_000_000.toDuration(DurationUnit.MICROSECONDS)
    },
    jsAssertion = JSAssertion.DoubleEqual(10.0)
  )
}
