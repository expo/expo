package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import org.junit.Test
import kotlin.time.Duration

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
}
