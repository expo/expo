package expo.modules.kotlin.records.formatters

import com.google.common.truth.Truth
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.toJSValueExperimental
import org.junit.Test

class FormatterTest {
  class MyRecord(
    @Field val a: String = "a",
    @Field val b: String? = "b",
    @Field val c: String = "c"
  ) : Record

  @Test
  fun `skip fields`() {
    val formatter = formatter {
      property(MyRecord::a).skip()
      property(MyRecord::b).skip(OnNull())
    }

    val record1 = MyRecord()
    val record2 = MyRecord(b = null)

    val formatted1 = formatter(record1).toJSValueExperimental()
    val formatted2 = formatter(record2).toJSValueExperimental()

    Truth.assertThat(formatted1).containsExactly("b", "b", "c", "c")
    Truth.assertThat(formatted2).containsExactly("c", "c")
  }

  @Test
  fun `map fields`() {
    val formatter = formatter {
      property(MyRecord::a)
        .map { value -> value.replace("a", "d") }

      property(MyRecord::b)
        .map { value -> value ?: "b" }
        .map { value -> value?.uppercase() }
        .map { value ->
          value?.replace("B", "E")
        }
      property(MyRecord::c).skip()
    }

    val record = MyRecord()

    val formatted = formatter(record).toJSValueExperimental()

    Truth.assertThat(formatted).containsExactly("a", "d", "b", "E")
  }

  @Test
  fun `combine map with skip`() {
    val formatter = formatter {
      property(MyRecord::b).skip()
      property(MyRecord::c).skip()

      property(MyRecord::a)
        .map { v -> v.uppercase() }
        .skip { v -> v == "A" }
        .map { v -> v.replace("B", "Z") }
    }

    val r1 = formatter(MyRecord(a = "a")).toJSValueExperimental()
    val r2 = formatter(MyRecord(a = "b")).toJSValueExperimental()

    Truth.assertThat(r1).hasSize(0)
    Truth.assertThat(r2).containsExactly("a", "Z")
  }

  @Test
  fun `nested record`() {
    class NestedRecord(
      @Field val a: String = "a",
      @Field val b: String = "b"
    ) : Record

    class MyRecordWithNested(
      @Field val nested: NestedRecord = NestedRecord()
    ) : Record

    val formatter = formatter {
      property(MyRecordWithNested::nested)
        .format {
          property(NestedRecord::b).skip()
        }
    }

    val record = MyRecordWithNested()
    val formatted = formatter(record).toJSValueExperimental()

    Truth.assertThat(formatted).containsExactly("nested", mapOf("a" to "a"))
  }
}
