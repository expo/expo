package expo.modules.kotlin.methods

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.google.common.truth.Truth
import org.junit.Test

class TypeMapperTest {
  @Test
  fun `cast dynamic to Int`() {
    val dynamic = DynamicFromObject(20.0)

    val casted = TypeMapper.cast(dynamic, TypeInformation(Int::class.java, false))

    Truth.assertThat(casted).isEqualTo(20)
  }

  @Test
  fun `cast null to nullable Int`() {
    val dynamic = DynamicFromObject(null)

    val casted = TypeMapper.cast(dynamic, TypeInformation(Int::class.java, true))

    Truth.assertThat(casted).isEqualTo(20)
  }

  @Test
  fun `cast dynamic to basic types`() {
    val dynamicSeeder = listOf(10, 20.0, "string", true, JavaOnlyArray(), JavaOnlyMap())
    val typesSeeder = dynamicSeeder.map(this::getCastableTypeFromObject)
    val types = typesSeeder.map { TypeInformation(it, false) }
    val dynamics = JavaOnlyArray.from(dynamicSeeder)

    val casted = types.withIndex().map { (index, type) ->
      val dynamic = dynamics.getDynamic(index)
      TypeMapper.cast(dynamic, type)
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
      listOf(10.0, 20.0, 30.0),
      listOf(null, "string")
    )
    val typesSeeder = listOf(List::class.java, List::class.java)
    val types = typesSeeder.map { TypeInformation(it, false) }
    val dynamics = JavaOnlyArray.from(dynamicSeeder)

    val casted = types.withIndex().map { (index, type) ->
      val dynamic = dynamics.getDynamic(index)
      TypeMapper.cast(dynamic, type)
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

    val casted = TypeMapper.cast(dynamic, TypeInformation(IntArray::class.java, false))

    Truth.assertThat(casted).isEqualTo(expected)
  }

  @Test
  fun `cast dynamic to int array`() {
    val dynamicSeeder = JavaOnlyArray().apply {
      pushDouble(10.0)
      pushNull()
      pushDouble(20.0)
      pushDouble(30.0)
    }
    val expected = arrayOf(10, null, 20, 30)
    val dynamic = DynamicFromObject(dynamicSeeder)

    val casted = TypeMapper.cast(dynamic, TypeInformation(Array<Int?>::class.java, false))

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

    val casted = TypeMapper.cast(dynamic, TypeInformation(Array<String?>::class.java, false))

    Truth.assertThat(casted).isEqualTo(expected)
  }

  private fun getCastableTypeFromObject(obj: Any): Class<*> {
    return when (obj) {
      is ReadableMap -> {
        ReadableMap::class.java
      }
      is ReadableArray -> {
        ReadableArray::class.java
      }
      else -> {
        obj::class.java
      }
    }
  }
}
