package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.formatters.formatter
import org.junit.Test

class FormatterTest {
  @Test
  fun uses_formatter_in_sync_function() {
    class MyRecord(
      @Field val a: String = "a",
      @Field val b: String? = "b",
      @Field val c: String = "c"
    ) : Record

    withSingleModule({
      Function("f1") { ->
        formatter {
          property(MyRecord::a).skip()
        }.format(MyRecord())
      }

      Function("f2") { ->
        formatter {
          property(MyRecord::a).map { value ->
            value.replace("a", "d")
          }
          property(MyRecord::b).map { value ->
            value ?: "default"
          }
          property(MyRecord::c).skip()
        }.format(MyRecord(b = null))
      }
    }) {
      val r1 = call("f1").getObject()
      val r2 = call("f2").getObject()

      Truth.assertThat(r1.getProperty("a").isUndefined()).isTrue()
      Truth.assertThat(r1.getProperty("b").getString()).isEqualTo("b")
      Truth.assertThat(r1.getProperty("c").getString()).isEqualTo("c")

      Truth.assertThat(r2.getProperty("a").getString()).isEqualTo("d")
      Truth.assertThat(r2.getProperty("b").getString()).isEqualTo("default")
      Truth.assertThat(r2.getProperty("c").isUndefined()).isTrue()
    }
  }

  @Test
  fun uses_formatter_in_async_function() {
    class MyRecord(
      @Field val a: String = "a",
      @Field val b: String? = "b",
      @Field val c: String = "c"
    ) : Record

    withSingleModule({
      AsyncFunction("f1") { ->
        formatter {
          property(MyRecord::a).skip()
        }.format(MyRecord())
      }

      AsyncFunction("f2") { ->
        formatter {
          property(MyRecord::a).map { value ->
            value.replace("a", "d")
          }
          property(MyRecord::b).map { value ->
            value ?: "default"
          }
          property(MyRecord::c).skip()
        }.format(MyRecord(b = null))
      }
    }) {
      val r1 = callAsync("f1").getObject()
      val r2 = callAsync("f2").getObject()

      Truth.assertThat(r1.getProperty("a").isUndefined()).isTrue()
      Truth.assertThat(r1.getProperty("b").getString()).isEqualTo("b")
      Truth.assertThat(r1.getProperty("c").getString()).isEqualTo("c")

      Truth.assertThat(r2.getProperty("a").getString()).isEqualTo("d")
      Truth.assertThat(r2.getProperty("b").getString()).isEqualTo("default")
      Truth.assertThat(r2.getProperty("c").isUndefined()).isTrue()
    }
  }
}
