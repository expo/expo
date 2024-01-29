package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.Promise
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import org.junit.Test

class JavaScriptModuleObjectTest {
  @Test
  fun hostObject_should_expose_addListener_when_events_dsl_exist() = withSingleModule({
    Events("onFoo")
  }) {
    val addListenerFunction = property("addListener")
    val removeListenersFunction = property("removeListeners")
    Truth.assertThat(addListenerFunction.isFunction()).isTrue()
    Truth.assertThat(removeListenersFunction.isFunction()).isTrue()
  }

  @Test
  fun hostObject_should_not_expose_addListener_by_default() = withSingleModule {
    val addListenerFunction = property("addListener")
    val removeListenersFunction = property("removeListeners")
    Truth.assertThat(addListenerFunction.isUndefined()).isTrue()
    Truth.assertThat(removeListenersFunction.isUndefined()).isTrue()
  }

  @Test
  fun hostObject_should_not_override_existing_addListener() = withSingleModule({
    Events("onFoo")
    Function("addListener") { name: String ->
      return@Function "echo $name"
    }
    AsyncFunction("removeListeners") { count: Int, promise: Promise ->
      promise.resolve("remove $count")
    }
  }) {
    val addListenerResult = call("addListener", "test".addSingleQuotes())
    Truth.assertThat(addListenerResult.isString()).isTrue()
    Truth.assertThat(addListenerResult.getString()).isEqualTo("echo test")

    val removedListenersResult = callAsync("removeListeners", "7")
    Truth.assertThat(removedListenersResult.isString()).isTrue()
    Truth.assertThat(removedListenersResult.getString()).isEqualTo("remove 7")
  }
}
