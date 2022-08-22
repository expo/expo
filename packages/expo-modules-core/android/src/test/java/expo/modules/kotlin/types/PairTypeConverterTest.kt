@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.kotlin.jni.CppType
import org.junit.Test
import kotlin.reflect.typeOf

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

  @Test
  fun `should return correct ExpectedType`() {
    val converter = TypeConverterProviderImpl.obtainTypeConverter(typeOf<Pair<Int, String>>())

    val expectedType = converter.getCppRequiredTypes()

    Truth.assertThat(expectedType.combinedTypes).isEqualTo(CppType.READABLE_ARRAY.value)
    Truth.assertThat(expectedType.possibleTypes).hasLength(1)

    val singleType = expectedType.possibleTypes.first()

    val firstType = singleType.parameterTypes!![0]
    val secondType = singleType.parameterTypes!![1]

    Truth.assertThat(firstType.combinedTypes).isEqualTo(CppType.INT.value)
    Truth.assertThat(secondType.combinedTypes).isEqualTo(CppType.STRING.value)
  }
}
