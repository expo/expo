package expo.modules.kotlin.records

import com.google.common.truth.Truth
import org.junit.Test
import kotlin.reflect.typeOf

class IsCollectionNotEmptyBinderTest {
  @Test
  fun `should bind the collection type to the collection validator`() {
    val binder = IsCollectionNotEmptyBinder()
    val listValidator = binder.bind(IsNotEmpty(), typeOf<List<Int>>())
    val mapValidator = binder.bind(IsNotEmpty(), typeOf<Map<Int, Int>>())

    Truth.assertThat(listValidator).isInstanceOf(IsNotEmptyCollectionValidator::class.java)
    Truth.assertThat(mapValidator).isInstanceOf(IsNotEmptyCollectionValidator::class.java)
  }

  @Test
  fun `should bind the array type to the array validator`() {
    val binder = IsCollectionNotEmptyBinder()
    val intArrayValidator = binder.bind(IsNotEmpty(), typeOf<IntArray>())
    val doubleArrayValidator = binder.bind(IsNotEmpty(), typeOf<DoubleArray>())
    val floatArrayValidator = binder.bind(IsNotEmpty(), typeOf<FloatArray>())
    val stringArrayValidator = binder.bind(IsNotEmpty(), typeOf<Array<String>>())

    Truth.assertThat(intArrayValidator).isInstanceOf(IsNotEmptyIntArrayValidator::class.java)
    Truth.assertThat(doubleArrayValidator).isInstanceOf(IsNotEmptyDoubleArrayValidator::class.java)
    Truth.assertThat(floatArrayValidator).isInstanceOf(IsNotEmptyFloatArrayValidator::class.java)
    Truth.assertThat(stringArrayValidator).isInstanceOf(IsNotEmptyArrayValidator::class.java)
  }
}
