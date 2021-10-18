package expo.modules.kotlin.methods

import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.kotlin.modules.Module
import org.junit.Test

class MethodTest {

  @Test
  fun `should attach module instance`() {
    class MyModule : Module()

    val module = MyModule()
    val promise = PromiseMock()
    val method = Method(
        "method",
        arrayOf(MyModule::class.java, Int::class.java)
    ) { args ->
      Truth.assertThat(args[0]).isSameInstanceAs(module)
      Truth.assertThat(args[1]).isEqualTo(10)
      return@Method -1
    }

    method.call(module, JavaOnlyArray().apply { pushInt(10) }, promise)

    Truth.assertWithMessage(promise.rejectMessage).that(promise.state).isEqualTo(PromiseState.RESOLVED)
    Truth.assertThat(promise.resolveValue).isEqualTo(-1)
  }

  @Test
  fun `should attach module instance if it's the only argument`() {
    class MyModule : Module()

    val module = MyModule()
    val promise = PromiseMock()
    val method = Method(
        "method",
        arrayOf(MyModule::class.java)
    ) { args ->
      Truth.assertThat(args[0]).isSameInstanceAs(module)
      return@Method -1
    }

    method.call(module, JavaOnlyArray(), promise)

    Truth.assertWithMessage(promise.rejectMessage).that(promise.state).isEqualTo(PromiseState.RESOLVED)
    Truth.assertThat(promise.resolveValue).isEqualTo(-1)
  }
}
