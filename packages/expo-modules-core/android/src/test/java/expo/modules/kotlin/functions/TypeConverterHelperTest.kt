package expo.modules.kotlin.functions

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.google.common.truth.Truth
import expo.modules.kotlin.types.convert
import org.junit.Test
import kotlin.reflect.typeOf

class TypeConverterHelperTest {
  @Test
  fun `cast dynamic to Int`() {
    val dynamic = DynamicFromObject(20.0)

    val casted = convert<Int>(dynamic)

    Truth.assertThat(casted).isEqualTo(20)
  }

  @Test
  fun `cast null to nullable Int`() {
    val dynamic = DynamicFromObject(null)

    val casted = convert<Int?>(dynamic)

    Truth.assertThat(casted).isEqualTo(null)
  }

  @Test
  fun `cast dynamic to basic types`() {
    val dynamicSeeder = listOf(10, 20.0, "string", true, JavaOnlyArray(), JavaOnlyMap())
    val types = listOf(typeOf<Int>(), typeOf<Double>(), typeOf<String>(), typeOf<Boolean>(), typeOf<ReadableArray>(), typeOf<ReadableMap>())
    val dynamics = JavaOnlyArray.from(dynamicSeeder)

    val casted = types.withIndex().map { (index, type) ->
      val dynamic = dynamics.getDynamic(index)
      convert(dynamic, type)
    }

    Truth.assertThat(casted).isEqualTo(dynamicSeeder)
  }

  @Test
  fun `cast dynamic to list`() {
    val dynamicSeeder = listOf(
      JavaOnlyArray().apply {
        pushDouble(10.0)
        pushDouble(20.0)
        pushDouble(30.0)
      },
      JavaOnlyArray().apply {
        pushNull()
        pushString("string")
      }
    )
    val expected = listOf(
      listOf(10, 20, 30),
      listOf(null, "string")
    )
    val types = listOf(typeOf<List<Int>>(), typeOf<List<String?>>())
    val dynamics = JavaOnlyArray.from(dynamicSeeder)

    val casted = types.withIndex().map { (index, type) ->
      val dynamic = dynamics.getDynamic(index)
      convert(dynamic, type)
    }

    Truth.assertThat(casted).isEqualTo(expected)
  }

  @Test
  fun `cast dynamic to primitive int array`() {
    val dynamicSeeder = JavaOnlyArray().apply {
      pushDouble(10.0)
      pushDouble(20.0)
      pushDouble(30.0)
    }
    val expected = intArrayOf(10, 20, 30)
    val dynamic = DynamicFromObject(dynamicSeeder)

    val casted = convert<IntArray>(dynamic)

    Truth.assertThat(casted).isEqualTo(expected)
  }

  @Test
  fun `cast dynamic to nullable int array`() {
    val dynamicSeeder = JavaOnlyArray().apply {
      pushDouble(10.0)
      pushNull()
      pushDouble(20.0)
      pushDouble(30.0)
    }
    val expected = arrayOf(10, null, 20, 30)
    val dynamic = DynamicFromObject(dynamicSeeder)

    val casted = convert<Array<Int?>>(dynamic)

    Truth.assertThat(casted).isEqualTo(expected)
  }

  @Test
  fun `cast dynamic to string array`() {
    val dynamicSeeder = JavaOnlyArray().apply {
      pushString("string")
      pushNull()
      pushString("string2")
    }
    val expected = arrayOf("string", null, "string2")
    val dynamic = DynamicFromObject(dynamicSeeder)

    val casted = convert<Array<String?>>(dynamic)

    Truth.assertThat(casted).isEqualTo(expected)
  }
}
