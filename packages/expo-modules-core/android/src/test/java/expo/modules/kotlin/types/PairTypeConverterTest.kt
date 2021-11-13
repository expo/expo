@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import org.junit.Test
import kotlin.reflect.typeOf

class PairTypeConverterTest {
  private val converter = PairTypeConverter()

  @Test
  fun `should convert array to pair`() {
    val array = DynamicFromObject(
      JavaOnlyArray().apply {
        pushInt(1)
        pushInt(2)
      }
    )

    val converted = converter.convert(array, KClassTypeWrapper(typeOf<Pair<Int, Int>>()))

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

    val converted = converter.convert(array, KClassTypeWrapper(typeOf<Pair<Int, String>>()))

    Truth.assertThat(converted).isInstanceOf(Pair::class.java)
    Truth.assertThat((converted as Pair<*, *>).first).isEqualTo(1)
    Truth.assertThat(converted.second).isEqualTo("second")
  }
}
