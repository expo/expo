package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry
import expo.modules.kotlin.sharedobjects.sharedObjectIdPropertyName
import org.junit.Test

class JavaScriptClassTest {
  @Test
  fun has_a_prototype() = withSingleModule({
    Class("MyClass")
  }) {
    val prototype = evaluateScript("$moduleRef.MyClass.prototype")
    Truth.assertThat(prototype.isObject()).isTrue()
  }

  @Test
  fun has_keys_in_prototype() = withSingleModule({
    Class("MyClass") {
      Function("myFunction") { }
      AsyncFunction("myAsyncFunction") { }
    }
  }) {
    val prototypeKeys = evaluateScript("Object.keys($moduleRef.MyClass.prototype)")
      .getArray()
      .map { it.getString() }
    Truth.assertThat(prototypeKeys).containsExactly(
      "myFunction",
      "myAsyncFunction"
    )
  }

  @Test
  fun defines_properties_on_initialization() = withSingleModule({
    Class("MyClass") {
      Property("foo") { ->
        "bar"
      }
    }
  }) {
    val jsObject = callClass("MyClass").getObject()
    Truth.assertThat(jsObject.getPropertyNames()).asList().containsExactly("foo")
    Truth.assertThat(jsObject.getProperty("foo").getString()).isEqualTo("bar")
  }

  @Test
  fun should_be_able_to_receive_owner() = withSingleModule({
    Class("MyClass") {
      Function("f") { owner: JavaScriptObject ->
        return@Function owner.getProperty("foo").getString()
      }
      Property("foo") { ->
        "bar"
      }
    }
  }) {
    val foo = callClass("MyClass", "f").getString()
    Truth.assertThat(foo).isEqualTo("bar")
  }

  @Test
  fun native_constructor_should_be_called() {
    var wasCalled = false
    withSingleModule({
      Class("MyClass") {
        Constructor {
          wasCalled = true
        }
      }
    }) {
      callClass("MyClass")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun shared_object_should_be_added_to_registry() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    withSingleModule({
      Class(MySharedObject::class) {
        Constructor {
          return@Constructor mySharedObject
        }
      }
    }) {
      val jsObject = callClass("MySharedObject").getObject()
      val id = SharedObjectId(jsObject.getProperty(sharedObjectIdPropertyName).getInt())

      val appContext = jsiInterop.appContextHolder.get()!!
      val (native, _) = appContext.sharedObjectRegistry.pairs[id]!!
      Truth.assertThat(native).isSameInstanceAs(mySharedObject)
    }
  }

  @Test
  fun shared_object_should_be_passed_as_this_in_sync_function() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    var wasCalled = false
    withSingleModule({
      Class(MySharedObject::class) {
        Constructor {
          return@Constructor mySharedObject
        }
        Function("receiveThis") { self: MySharedObject ->
          Truth.assertThat(self).isSameInstanceAs(mySharedObject)
          wasCalled = true
        }
      }
    }) {
      callClass("MySharedObject", "receiveThis")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun shared_object_should_be_passed_as_this_in_async_function() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    var wasCalled = false
    withSingleModule({
      Class(MySharedObject::class) {
        Constructor {
          return@Constructor mySharedObject
        }
        AsyncFunction("receiveThis") { self: MySharedObject ->
          Truth.assertThat(self).isSameInstanceAs(mySharedObject)
          wasCalled = true
        }
      }
    }) {
      callClassAsync("MySharedObject", "receiveThis")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun object_native_allocator_should_be_called_on_context_destroy() {
    class MySharedObject : SharedObject()

    var registry: SharedObjectRegistry? = null
    var id: SharedObjectId? = null
    withSingleModule({
      Class(MySharedObject::class) {
        Constructor {
          return@Constructor MySharedObject()
        }
      }
    }) {
      val jsObject = callClass("MySharedObject").getObject()
      id = SharedObjectId(jsObject.getProperty(sharedObjectIdPropertyName).getInt())
      registry = jsiInterop.appContextHolder.get()?.sharedObjectRegistry
    }

    Truth.assertThat(registry!!.pairs[id!!]).isNull()
  }

  @Test
  fun object_constructor_should_be_able_to_receive_js_object() = withSingleModule({
    Class("MyClass") {
      Constructor { self: JavaScriptObject ->
        self.setProperty("foo", "bar")
      }
    }
  }) {
    val result = classProperty("MyClass", "foo").getString()
    Truth.assertThat(result).isEqualTo("bar")
  }

  @Test
  fun class_with_shared_object_should_receives_self_in_properties() {
    class MySharedObject : SharedObject() {
      var x: Int = 20
      var y: Int = 30
    }

    withSingleModule({
      Class(MySharedObject::class) {
        Constructor {
          return@Constructor MySharedObject()
        }

        Property("x") { self: MySharedObject ->
          self.x
        }

        Property("y")
          .get { self: MySharedObject ->
            self.y
          }
      }
    }) {
      val x = classProperty("MySharedObject", "x").getInt()
      val y = classProperty("MySharedObject", "y").getInt()

      Truth.assertThat(x).isEqualTo(20)
      Truth.assertThat(y).isEqualTo(30)
    }
  }
}
