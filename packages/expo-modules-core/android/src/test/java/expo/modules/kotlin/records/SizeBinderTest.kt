package expo.modules.kotlin.records

import com.google.common.truth.Truth
import org.junit.Test
import kotlin.reflect.typeOf

class SizeBinderTest {
  @Test
  fun `should bind the collection type to the collection validator`() {
    val binder = SizeBinder()
    val listValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<List<Int>>())
    val mapValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<Map<Int, Int>>())

    Truth.assertThat(listValidator).isInstanceOf(CollectionSizeValidator::class.java)
    Truth.assertThat(mapValidator).isInstanceOf(CollectionSizeValidator::class.java)
  }

  @Test
  fun `should bind the array type to the array validator`() {
    val binder = SizeBinder()
    val intArrayValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<IntArray>())
    val doubleArrayValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<DoubleArray>())
    val floatArrayValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<FloatArray>())
    val stringArrayValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<Array<String>>())

    Truth.assertThat(intArrayValidator).isInstanceOf(IntArraySizeValidator::class.java)
    Truth.assertThat(doubleArrayValidator).isInstanceOf(DoubleArraySizeValidator::class.java)
    Truth.assertThat(floatArrayValidator).isInstanceOf(FloatArraySizeValidator::class.java)
    Truth.assertThat(stringArrayValidator).isInstanceOf(ArraySizeValidator::class.java)
  }

  @Test
  fun `should bind the string type to the string validator`() {
    val binder = SizeBinder()
    val stringValidator = binder.bind(Size(min = 0, max = Int.MAX_VALUE), typeOf<String>())

    Truth.assertThat(stringValidator).isInstanceOf(StringSizeValidator::class.java)
  }
}
