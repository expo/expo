package expo.modules.kotlin.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import org.junit.Test
import kotlin.reflect.typeOf

internal class ExpectedTypeTest {
  @Test
  fun `should return expected type for Int`() {
    val type = typeOf<Int>()
    val expectedType = ExpectedType.fromKType(type)

    Truth.assertThat(expectedType).isInstanceOf(ExpectedType::class.java)
    Truth.assertThat(expectedType.getPossibleTypes().size).isEqualTo(1)

    Truth.assertThat(expectedType.getFirstType().expectedCppType).isInstanceOf(CppType::class.java)
    Truth.assertThat(expectedType.getFirstType().expectedCppType).isEqualTo(CppType.INT)
  }

  @Test
  fun `should return expected type for Float`() {
    val type = typeOf<Float>()
    val expectedType = ExpectedType.fromKType(type)
    val anticipatedExpectedType = ExpectedType(SingleType(CppType.FLOAT))

    Truth.assertThat(expectedType).isEqualTo(anticipatedExpectedType)
  }

  @Test
  fun `should return expected type for List of Ints`() {
    val type = typeOf<List<Int>>()
    val expectedType = ExpectedType.fromKType(type)
    val anticipatedExpectedType = ExpectedType(SingleType(CppType.LIST, arrayOf(ExpectedType(SingleType(CppType.INT)))))

    Truth.assertThat(expectedType).isEqualTo(anticipatedExpectedType)
  }

  @Test
  fun `should return expected type for Map of Lists of Doubles`() {
    val type = typeOf<Map<String, List<Double>>>()
    val expectedType = ExpectedType.fromKType(type)
    val anticipatedExpectedType = ExpectedType(SingleType(CppType.MAP, arrayOf(ExpectedType(SingleType(CppType.LIST, arrayOf(ExpectedType(SingleType(CppType.DOUBLE))))))))

    Truth.assertThat(expectedType).isEqualTo(anticipatedExpectedType)
  }
}
