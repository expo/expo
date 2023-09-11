@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.Promise
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptModuleObjectTest {
  @Test
  fun hostObject_should_expose_addListener_when_events_dsl_exist() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Events("onFoo")
    }
  ) {
    val addListenerFunction = evaluateScript("expo.modules.TestModule.addListener")
    val removeListenersFunction = evaluateScript("expo.modules.TestModule.removeListeners")
    Truth.assertThat(addListenerFunction.isFunction()).isTrue()
    Truth.assertThat(removeListenersFunction.isFunction()).isTrue()
  }

  @Test
  fun hostObject_should_not_expose_addListener_by_default() = withJSIInterop(
    inlineModule {
      Name("TestModule")
    }
  ) {
    val addListenerFunction = evaluateScript("expo.modules.TestModule.addListener")
    val removeListenersFunction = evaluateScript("expo.modules.TestModule.removeListeners")
    Truth.assertThat(addListenerFunction.isUndefined()).isTrue()
    Truth.assertThat(removeListenersFunction.isUndefined()).isTrue()
  }

  @Test
  fun hostObject_should_not_override_existing_addListener() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Events("onFoo")
      Function("addListener") { name: String ->
        return@Function "echo $name"
      }
      AsyncFunction("removeListeners") { count: Int, promise: Promise ->
        promise.resolve("remove $count")
      }
    }
  ) { methodQueue ->
    val addListenerResult = evaluateScript("expo.modules.TestModule.addListener('test')")
    Truth.assertThat(addListenerResult.isString()).isTrue()
    Truth.assertThat(addListenerResult.getString()).isEqualTo("echo test")

    val removedListenersResult = waitForAsyncFunction(methodQueue, "expo.modules.TestModule.removeListeners(7)")
    Truth.assertThat(removedListenersResult.isString()).isTrue()
    Truth.assertThat(removedListenersResult.getString()).isEqualTo("remove 7")
  }
}
