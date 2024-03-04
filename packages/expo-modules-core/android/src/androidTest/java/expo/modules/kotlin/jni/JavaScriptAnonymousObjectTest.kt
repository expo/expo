package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.objects.Object
import org.junit.Test

class JavaScriptAnonymousObjectTest {
  @Test
  fun returns_object_made_from_definition() = withSingleModule({
    Function("getObject") {
      Object {
        Property("p1") { 123 }
        Function("f1") { "abc" }
        AsyncFunction("f2") { "def" }
      }
    }
  }) {
    val anonymousObject = evaluateScript("object = $moduleRef.getObject()")
      .getObject()
    val p1 = evaluateScript("object.p1").getInt()
    val f1 = evaluateScript("object.f1()").getString()
    val f2 = waitForAsyncFunction("object.f2()").getString()

    Truth.assertThat(anonymousObject.getPropertyNames().toList()).containsAtLeastElementsIn(arrayOf("p1", "f2", "f1"))
    Truth.assertThat(p1).isEqualTo(123)
    Truth.assertThat(f1).isEqualTo("abc")
    Truth.assertThat(f2).isEqualTo("def")
  }

  @Test
  fun anonymous_object_can_be_nested() = withSingleModule({
    Function("getObject") {
      Object {
        Function("f1") {
          Object {
            Property("p1") { 123 }
          }
        }
      }
    }
  }) {
    val anonymousObject = evaluateScript("object = $moduleRef.getObject().f1()")
      .getObject()
    val p1 = evaluateScript("object.p1").getInt()

    Truth.assertThat(anonymousObject.getPropertyNames().toList()).contains("p1")
    Truth.assertThat(p1).isEqualTo(123)
  }
}
