@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.sharedobjects.sharedObjectIdPropertyName
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class SharedObjectTest {
  @Test
  fun shared_object_class_should_exists() = withJSIInterop {
    val sharedObjectClass = evaluateScript("expo.SharedObject")
    Truth.assertThat(sharedObjectClass.isFunction()).isTrue()
  }

  @Test
  fun has_release_function_in_prototype() = withJSIInterop {
    val releaseFunction = evaluateScript("expo.SharedObject.prototype.release")
    Truth.assertThat(releaseFunction.isFunction()).isTrue()
  }

  @Test
  fun can_be_created() = withJSIInterop {
    val sharedObjectInstance = evaluateScript("new expo.SharedObject()")
    Truth.assertThat(sharedObjectInstance.isObject()).isTrue()
  }

  @Test
  fun inherits_from_EventEmitter() = withJSIInterop {
    val inheritsFromEventEmitter = evaluateScript("new expo.SharedObject() instanceof expo.EventEmitter")
    Truth.assertThat(inheritsFromEventEmitter.getBool()).isTrue()
  }

  @Test
  fun has_base_class_prototype() = withExampleSharedClass {
    val hasBaseClassPrototype = evaluateScript(
      "$moduleRef.SharedObjectExampleClass.prototype instanceof expo.SharedObject"
    ).getBool()
    Truth.assertThat(hasBaseClassPrototype).isTrue()
  }

  @Test
  fun can_creates_new_instance() = withExampleSharedClass {
    val sharedObject = callClass("SharedObjectExampleClass")
    Truth.assertThat(sharedObject.isObject()).isTrue()
  }

  @Test
  fun should_register() = withExampleSharedClass {
    val sharedObject = callClass("SharedObjectExampleClass")
    val sharedObjectId = sharedObject.getObject().getProperty(sharedObjectIdPropertyName).getInt()
    val containSharedObject = jsiInterop
      .runtimeContextHolder
      .get()
      ?.sharedObjectRegistry
      ?.pairs
      ?.contains(SharedObjectId(sharedObjectId))

    Truth.assertThat(containSharedObject).isTrue()
  }

  @Test
  fun is_instance_of() = withExampleSharedClass {
    val isInstanceOf = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()",
      "sharedObject instanceof expo.SharedObject"
    ).getBool()
    Truth.assertThat(isInstanceOf).isTrue()
  }

  @Test
  fun has_functions_from_base_class() = withExampleSharedClass {
    val releaseFunction = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()",
      "sharedObject.release"
    )
    Truth.assertThat(releaseFunction.isFunction()).isTrue()
  }

  @Test
  fun sends_events() = withExampleSharedClass {
    val jsObject = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()"
    ).getObject()

    // Add a listener that adds three arguments
    evaluateScript(
      "total = 0",
      "sharedObject.addListener('test event', (a, b, c) => { total = a + b + c })"
    )

    // Get the native instance
    val nativeObject = jsiInterop
      .runtimeContextHolder
      .get()
      ?.sharedObjectRegistry
      ?.toNativeObjectOrNull(jsObject)

    // Send an event from the native object to JS
    nativeObject?.emit("test event", 1, 2, 3)

    // Check the value that is set by the listener
    val total = evaluateScript("total")

    Truth.assertThat(total.isNumber()).isTrue()
    Truth.assertThat(total.getInt()).isEqualTo(6)
  }

  @Test
  fun should_be_able_to_throw_from_constructor() = withSingleModule({
    Class("ThrowingSharedObject") {
      Constructor {
        throw CodedException("Code", "This is a test exception", null)
      }
    }
  }) {
    val exception = evaluateScript(
      """
      let exception = null;
      try {
        new $moduleRef.ThrowingSharedObject()
      } catch (e) {
        if (e instanceof global.ExpoModulesCore_CodedError) {
          exception = e;
        }
      }
      exception
      """.trimIndent()
    ).getObject()

    Truth.assertThat(exception.getProperty("code").getString()).isEqualTo("Code")
    Truth.assertThat(exception.getProperty("message").getString()).contains("This is a test exception")
  }

  @Test
  fun should_be_able_to_return_new_instance_from_function() = withSingleModule({
    Function("createSharedObject") {
      SharedObjectExampleClass()
    }
    Class<SharedObjectExampleClass> {
      Constructor { SharedObjectExampleClass() }
    }
  }) {
    val hasCorrectPrototype = evaluateScript(
      """
      const sharedObjectFromFunction = $moduleRef.createSharedObject();
      const sharedObjectFromConstructor = new $moduleRef.SharedObjectExampleClass();
      sharedObjectFromFunction.prototype === sharedObjectFromConstructor.prototype;
      """.trimIndent()
    ).getBool()

    Truth.assertThat(hasCorrectPrototype).isTrue()
  }

  @Test
  fun should_call_start_observing_with_this() = withSingleModule({
    Class<SharedObjectExampleClass> {
      Constructor { SharedObjectExampleClass() }

      Events("event")

      Function("lastOnStartObserving") { self: SharedObjectExampleClass ->
        self.lastOnStartObserving
      }

      Function("lastOnStopObserving") { self: SharedObjectExampleClass ->
        self.lastOnStopObserving
      }
    }
  }) {
    val lastStartObserving = evaluateScript(
      """
      const sharedObject = new $moduleRef.SharedObjectExampleClass();
      global.listener = sharedObject.addListener('event', () => {});
      global.sharedObject = sharedObject;
      sharedObject.lastOnStartObserving()
      """.trimIndent()
    ).getString()

    val lastOnStopObserving = evaluateScript(
      """
      global.listener.remove();
      global.sharedObject.lastOnStopObserving()
      """.trimIndent()
    ).getString()

    Truth.assertThat(lastStartObserving).isEqualTo("event")
    Truth.assertThat(lastOnStopObserving).isEqualTo("event")
  }

  private class SharedObjectExampleClass : SharedObject() {
    var lastOnStartObserving = ""
    var lastOnStopObserving = ""

    override fun onStartListeningToEvent(eventName: String) {
      lastOnStartObserving = eventName
    }

    override fun onStopListeningToEvent(eventName: String) {
      lastOnStopObserving = eventName
    }
  }

  private fun withExampleSharedClass(
    block: SingleTestContext.() -> Unit
  ) = withSingleModule({
    Class(SharedObjectExampleClass::class) {
      Constructor {
        SharedObjectExampleClass()
      }
    }
  }, numberOfReloads = 1, block)
}
