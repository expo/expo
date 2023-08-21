package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import org.junit.Test

class PairTypeConverterTest {
  @Test
  fun `should convert array to pair`() {
    val array = DynamicFromObject(
      JavaOnlyArray().apply {
        pushInt(1)
        pushInt(2)
      }
    )

    val converted = convert<Pair<Int, Int>>(array)

    Truth.assertThat(converted).isInstanceOf(Pair::class.java)
    Truth.assertThat((converted as Pair<*, *>).first).isEqualTo(1)
    Truth.assertThat(converted.second).isEqualTo(2)
  }

  @Test
  fun `should convert array with two different types to pair`() {
    val array = DynamicFromObject(
      JavaOnlyArray().apply {
        pushInt(1)
        pushString("second")
      }
    )

    val converted = convert<Pair<Int, String>>(array)

    Truth.assertThat(converted).isInstanceOf(Pair::class.java)
    Truth.assertThat((converted as Pair<*, *>).first).isEqualTo(1)
    Truth.assertThat(converted.second).isEqualTo("second")
  }
}
