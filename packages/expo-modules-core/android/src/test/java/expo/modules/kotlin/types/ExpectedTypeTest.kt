package expo.modules.kotlin.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import org.junit.Test

internal class ExpectedTypeTest {
  @Test
  fun `should return expected type for Int`() {
    val expectedType = ExpectedType.fromTypeDescriptor(typeDescriptorOf<Int>())

    Truth.assertThat(expectedType).isInstanceOf(ExpectedType::class.java)
    Truth.assertThat(expectedType.getPossibleTypes().size).isEqualTo(1)

    Truth.assertThat(expectedType.getFirstType().expectedCppType).isInstanceOf(CppType::class.java)
    Truth.assertThat(expectedType.getFirstType().expectedCppType).isEqualTo(CppType.INT)
  }

  @Test
  fun `should return expected type for Float`() {
    val expectedType = ExpectedType.fromTypeDescriptor(typeDescriptorOf<Float>())
    val anticipatedExpectedType = ExpectedType(SingleType(CppType.FLOAT))

    Truth.assertThat(expectedType).isEqualTo(anticipatedExpectedType)
  }

  @Test
  fun `should return expected type for List of Ints`() {
    val expectedType = ExpectedType.fromTypeDescriptor(typeDescriptorOf<List<Int>>())

    val anticipatedExpectedType = ExpectedType(SingleType(CppType.LIST, arrayOf(ExpectedType(SingleType(CppType.INT)))))

    Truth.assertThat(expectedType).isEqualTo(anticipatedExpectedType)
  }

  @Test
  fun `should return expected type for Map of Lists of Doubles`() {
    val expectedType = ExpectedType.fromTypeDescriptor(typeDescriptorOf<Map<String, List<Double>>>())
    val anticipatedExpectedType = ExpectedType(SingleType(CppType.MAP, arrayOf(ExpectedType(SingleType(CppType.LIST, arrayOf(ExpectedType(SingleType(CppType.DOUBLE))))))))

    Truth.assertThat(expectedType).isEqualTo(anticipatedExpectedType)
  }
}
