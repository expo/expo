package expo.modules.kotlin.types

import android.os.Bundle
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.google.common.truth.Truth
import expo.modules.kotlin.EnumWithInt
import expo.modules.kotlin.EnumWithString
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class JSTypeConverterTest {
  private object TestContainerProvider : JSTypeConverter.ContainerProvider {
    override fun createMap(): WritableMap = JavaOnlyMap()
    override fun createArray(): WritableArray = JavaOnlyArray()
  }

  @Test
  fun `should convert Bundle`() {
    val bundle = Bundle().apply {
      putInt("int", 123)
      putString("string", "expo is awesome")
      putStringArray("stringArray", arrayOf("s1", "s2"))
    }

    val converted = JSTypeConverter.legacyConvertToJSValue(bundle, TestContainerProvider)

    Truth.assertThat(converted).isInstanceOf(WritableMap::class.java)
    val map = converted as WritableMap

    Truth.assertThat(map.getInt("int")).isEqualTo(123)
    Truth.assertThat(map.getString("string")).isEqualTo("expo is awesome")
    val innerArray = map.getArray("stringArray")
    Truth.assertThat(innerArray?.getString(0)).isEqualTo("s1")
    Truth.assertThat(innerArray?.getString(1)).isEqualTo("s2")
  }

  @Test
  fun `should convert Iterable`() {
    val list = listOf(1, 2, 3)
    val set = setOf(1, 2, 3)
    val linkedList = listOfNotNull(1, 2, 3)

    val collections = listOf(list, set, linkedList)

    for (collection in collections) {
      val converted = JSTypeConverter.legacyConvertToJSValue(collection, TestContainerProvider)
      Truth.assertThat(converted).isInstanceOf(WritableArray::class.java)
      val array = converted as WritableArray
      Truth.assertThat(array.getInt(0)).isEqualTo(1)
      Truth.assertThat(array.getInt(1)).isEqualTo(2)
      Truth.assertThat(array.getInt(2)).isEqualTo(3)
    }
  }

  @Test
  fun `should convert Array`() {
    val array = arrayOf("s1", "s2", "s3")

    val converted = JSTypeConverter.legacyConvertToJSValue(array, TestContainerProvider)

    Truth.assertThat(converted).isInstanceOf(WritableArray::class.java)
    val convertedArray = converted as WritableArray
    Truth.assertThat(convertedArray.getString(0)).isEqualTo("s1")
    Truth.assertThat(convertedArray.getString(1)).isEqualTo("s2")
    Truth.assertThat(convertedArray.getString(2)).isEqualTo("s3")
  }

  @Test
  fun `should convert IntArray`() {
    val array = IntArray(3) { it }

    val converted = JSTypeConverter.legacyConvertToJSValue(array, TestContainerProvider)

    Truth.assertThat(converted).isInstanceOf(WritableArray::class.java)
    val convertedArray = converted as WritableArray
    Truth.assertThat(convertedArray.getInt(0)).isEqualTo(0)
    Truth.assertThat(convertedArray.getInt(1)).isEqualTo(1)
    Truth.assertThat(convertedArray.getInt(2)).isEqualTo(2)
  }

  @Test
  fun `should convert DoubleArray`() {
    val array = DoubleArray(3) { it.toDouble() }

    val converted = JSTypeConverter.legacyConvertToJSValue(array, TestContainerProvider)

    Truth.assertThat(converted).isInstanceOf(WritableArray::class.java)
    val convertedArray = converted as WritableArray
    Truth.assertThat(convertedArray.getDouble(0)).isEqualTo(0.0)
    Truth.assertThat(convertedArray.getDouble(1)).isEqualTo(1.0)
    Truth.assertThat(convertedArray.getDouble(2)).isEqualTo(2.0)
  }

  @Test
  fun `should convert Map`() {
    val map = mapOf(
      "k1" to "v1",
      "k2" to "v2"
    )

    val converted = JSTypeConverter.legacyConvertToJSValue(map, TestContainerProvider)

    Truth.assertThat(converted).isInstanceOf(WritableMap::class.java)
    val convertedMap = converted as WritableMap
    Truth.assertThat(convertedMap.getString("k1")).isEqualTo("v1")
    Truth.assertThat(convertedMap.getString("k2")).isEqualTo("v2")
  }

  @Test
  fun `should convert Record`() {
    @Suppress("unused")
    class MyRecord : Record {
      @Field
      val int: Int = 2

      @Field(key = "customKey")
      val string: String = "123"
    }

    val record = MyRecord()

    val converted = JSTypeConverter.legacyConvertToJSValue(record, TestContainerProvider)

    Truth.assertThat(converted).isInstanceOf(WritableMap::class.java)
    val convertedRecord = converted as WritableMap
    Truth.assertThat(convertedRecord.getInt("int")).isEqualTo(2)
    Truth.assertThat(convertedRecord.getString("customKey")).isEqualTo("123")
  }

  @Test
  fun `should convert complex structures`() {
    @Suppress("unused")
    class MyRecord : Record {
      inner class InnerRecord : Record {
        @Field
        val int = 2
      }

      @Field
      val map = mapOf("k1" to "v1", "k2" to "v2")

      @Field
      val record = InnerRecord()

      @Field
      val intArray = IntArray(3) { it }

      @Field
      val stringList = listOf("s1", "s2")

      @Field
      val intEnum = EnumWithInt.VALUE1

      @Field
      val stringEnum = EnumWithString.VALUE1
    }

    val record = MyRecord()

    val converted = JSTypeConverter.legacyConvertToJSValue(record, TestContainerProvider)
    Truth.assertThat(converted).isInstanceOf(WritableMap::class.java)
    val convertedRecord = converted as WritableMap

    val map = convertedRecord.getMap("map")
    Truth.assertThat(map?.getString("k1")).isEqualTo("v1")
    Truth.assertThat(map?.getString("k2")).isEqualTo("v2")

    val innerRecord = convertedRecord.getMap("record")
    Truth.assertThat(innerRecord?.getInt("int")).isEqualTo(2)

    val intArray = convertedRecord.getArray("intArray")
    Truth.assertThat(intArray?.getInt(0)).isEqualTo(0)
    Truth.assertThat(intArray?.getInt(1)).isEqualTo(1)
    Truth.assertThat(intArray?.getInt(2)).isEqualTo(2)

    val stringList = convertedRecord.getArray("stringList")
    Truth.assertThat(stringList?.getString(0)).isEqualTo("s1")
    Truth.assertThat(stringList?.getString(1)).isEqualTo("s2")

    val intEnum = convertedRecord.getInt("intEnum")
    Truth.assertThat(intEnum).isEqualTo(1)

    val stringEnum = convertedRecord.getString("stringEnum")
    Truth.assertThat(stringEnum).isEqualTo("value1")
  }
}
