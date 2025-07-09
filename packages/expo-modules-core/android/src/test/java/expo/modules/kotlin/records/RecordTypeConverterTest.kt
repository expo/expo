package expo.modules.kotlin.records

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.google.common.truth.Truth
import expo.modules.kotlin.EnumWithInt
import expo.modules.kotlin.EnumWithString
import expo.modules.kotlin.EnumWithoutParameter
import expo.modules.kotlin.types.convert
import org.junit.Test

class RecordTypeConverterTest {
  @Test
  fun `should convert map to mutable record`() {
    class MyRecord : Record {
      @Field
      var int: Int = 0

      @Field
      var string: String = ""
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("int", 10)
        putString("string", "expo")
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.int).isEqualTo(10)
    Truth.assertThat(myRecord.string).isEqualTo("expo")
  }

  @Test
  fun `should convert map to immutable record`() {
    class MyRecord : Record {
      @Field
      val int: Int = 0

      @Field
      val string: String = ""
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("int", 10)
        putString("string", "expo")
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.int).isEqualTo(10)
    Truth.assertThat(myRecord.string).isEqualTo("expo")
  }

  @Test
  fun `should convert map to lateinit record`() {
    class MyRecord : Record {
      @Field
      lateinit var string: String
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putString("string", "expo")
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.string).isEqualTo("expo")
  }

  @Test
  fun `should convert map to mixed record`() {
    class MyRecord : Record {
      @Field
      val int: Int = 0

      @Field
      var int2: Int = -10

      @Field
      lateinit var string: String
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("int", 10)
        putInt("int2", 20)
        putString("string", "expo")
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.int).isEqualTo(10)
    Truth.assertThat(myRecord.int2).isEqualTo(20)
    Truth.assertThat(myRecord.string).isEqualTo("expo")
  }

  @Test
  fun `should respect required annotation`() {
    class MyRecord : Record {
      @Field
      @Required
      val int: Int = 0
    }

    val map = DynamicFromObject(JavaOnlyMap())

    val exception = runCatching { convert<MyRecord>(map) }.exceptionOrNull()
    Truth.assertThat(exception).isNotNull()
  }

  @Test
  fun `should respect validators`() {
    class MyRecord : Record {
      @Field
      @IntRange(from = 0, to = 10)
      val int: Int = 0
    }

    val invalidMap = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("int", 11)
      }
    )

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("int", 6)
      }
    )

    val record = convert<MyRecord>(map)
    Truth.assertThat(record.int).isEqualTo(6)
    val exception = runCatching { convert<MyRecord>(invalidMap) }.exceptionOrNull()
    Truth.assertThat(exception).isNotNull()
  }

  @Test
  fun `should respect custom js key`() {
    class MyRecord : Record {
      @Field(key = "point1")
      val int: Int = 0

      @Field(key = "point2")
      var int2: Int = -10

      @Field(key = "str")
      lateinit var string: String
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("point1", 10)
        putInt("point2", 20)
        putString("str", "expo")
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.int).isEqualTo(10)
    Truth.assertThat(myRecord.int2).isEqualTo(20)
    Truth.assertThat(myRecord.string).isEqualTo("expo")
  }

  @Test
  fun `should respect non required value`() {
    class MyRecord : Record {
      @Field
      val required: Int = 10

      @Field
      val int: Int = 20

      @Field
      val string: String? = null
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putInt("required", 2137)
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.required).isEqualTo(2137)
    Truth.assertThat(myRecord.int).isEqualTo(20)
    Truth.assertThat(myRecord.string).isEqualTo(null)
  }

  @Test
  fun `primary constructor default values shouldn't be ignored if using the 'shorthand' class syntax`() {
    class MyRecord(
      @Field
      val int: Int = 42,
      @Field
      val string: String? = "string",
      @Field
      val boolean: Boolean = true
    ) : Record

    val map = DynamicFromObject(
      JavaOnlyMap()
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.int).isEqualTo(42)
    Truth.assertThat(myRecord.string).isEqualTo("string")
    Truth.assertThat(myRecord.boolean).isEqualTo(true)
  }

  @Test
  fun `should work with complex types`() {
    class InnerRecord : Record {
      @Field
      lateinit var name: String

      override fun hashCode(): Int {
        return name.hashCode()
      }

      override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as InnerRecord

        return name == other.name
      }
    }

    class MyRecord : Record {
      @Field
      lateinit var points: List<Double>

      @Field
      lateinit var innerRecord: InnerRecord
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putArray(
          "points",
          JavaOnlyArray().apply {
            pushDouble(1.0)
            pushDouble(2.0)
            pushDouble(3.0)
          }
        )
        putMap(
          "innerRecord",
          JavaOnlyMap().apply {
            putString("name", "value")
          }
        )
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.innerRecord).isEqualTo(InnerRecord().apply { name = "value" })
    Truth.assertThat(myRecord.points).isEqualTo(listOf(1.0, 2.0, 3.0))
  }

  @Test
  fun `should work with enums`() {
    class MyRecord : Record {
      @Field
      lateinit var enumWithoutParameter: EnumWithoutParameter

      @Field
      lateinit var enumWithInt: EnumWithInt

      @Field
      lateinit var enumWithString: EnumWithString
    }

    val map = DynamicFromObject(
      JavaOnlyMap().apply {
        putString("enumWithoutParameter", "VALUE2")
        putInt("enumWithInt", 1)
        putString("enumWithString", "value3")
      }
    )

    val myRecord = convert<MyRecord>(map)

    Truth.assertThat(myRecord.enumWithoutParameter).isEqualTo(EnumWithoutParameter.VALUE2)
    Truth.assertThat(myRecord.enumWithInt).isEqualTo(EnumWithInt.VALUE1)
    Truth.assertThat(myRecord.enumWithString).isEqualTo(EnumWithString.VALUE3)
  }
}
