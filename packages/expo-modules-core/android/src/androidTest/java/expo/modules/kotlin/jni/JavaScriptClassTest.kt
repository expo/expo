@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.sharedobjects.sharedObjectIdPropertyName
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptClassTest {
  @Test
  fun has_a_prototype() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass")
    }
  ) {
    val prototype = evaluateScript("expo.modules.TestModule.MyClass.prototype")
    Truth.assertThat(prototype.isObject()).isTrue()
  }

  @Test
  fun has_keys_in_prototype() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass") {
        Function("myFunction") { }
        AsyncFunction("myAsyncFunction") { }
      }
    }
  ) {
    val prototypeKeys = evaluateScript("Object.keys(expo.modules.TestModule.MyClass.prototype)")
      .getArray()
      .map { it.getString() }
    Truth.assertThat(prototypeKeys).containsExactly(
      "myFunction",
      "myAsyncFunction"
    )
  }

  @Test
  fun defines_properties_on_initialization() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass") {
        Property("foo") {
          "bar"
        }
      }
    }
  ) {
    val jsObject = evaluateScript("new expo.modules.TestModule.MyClass()").getObject()
    Truth.assertThat(jsObject.getPropertyNames()).asList().containsExactly("foo")
    Truth.assertThat(jsObject.getProperty("foo").getString()).isEqualTo("bar")
  }

  @Test
  fun should_be_able_to_receive_owner() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass") {
        Function("f") { owner: JavaScriptObject ->
          return@Function owner.getProperty("foo").getString()
        }
        Property("foo") {
          "bar"
        }
      }
    }
  ) {
    val foo = evaluateScript("(new expo.modules.TestModule.MyClass().f())").getString()
    Truth.assertThat(foo).isEqualTo("bar")
  }

  @Test
  fun native_constructor_should_be_called() {
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Class("MyClass") {
          Constructor {
            wasCalled = true
          }
        }
      }
    ) {
      evaluateScript("new expo.modules.TestModule.MyClass()")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun shared_object_should_be_added_to_registry() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Class(MySharedObject::class) {
          Constructor {
            return@Constructor mySharedObject
          }
        }
      }
    ) {
      val jsObject = evaluateScript("new expo.modules.TestModule.MySharedObject()").getObject()
      val id = SharedObjectId(jsObject.getProperty(sharedObjectIdPropertyName).getInt())

      val appContext = appContextHolder.get()!!
      val (native, _) = appContext.sharedObjectRegistry.pairs[id]!!
      Truth.assertThat(native).isSameInstanceAs(mySharedObject)
    }
  }

  @Test
  fun shared_object_should_be_passed_as_this_in_sync_function() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Class(MySharedObject::class) {
          Constructor {
            return@Constructor mySharedObject
          }
          Function("receiveThis") { self: MySharedObject ->
            Truth.assertThat(self).isSameInstanceAs(mySharedObject)
            wasCalled = true
          }
        }
      }
    ) {
      evaluateScript("(new expo.modules.TestModule.MySharedObject()).receiveThis()")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun shared_object_should_be_passed_as_this_in_async_function() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Class(MySharedObject::class) {
          Constructor {
            return@Constructor mySharedObject
          }
          AsyncFunction("receiveThis") { self: MySharedObject ->
            Truth.assertThat(self).isSameInstanceAs(mySharedObject)
            wasCalled = true
          }
        }
      }
    ) {
      waitForAsyncFunction(it, "(new expo.modules.TestModule.MySharedObject()).receiveThis()")
      Truth.assertThat(wasCalled).isTrue()
    }
  }
}
