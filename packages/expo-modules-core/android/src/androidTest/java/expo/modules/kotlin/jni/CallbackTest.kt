@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert
import org.junit.Test

class CallbackTest {
  class ProgressRecord : Record {
    @Field
    var percent: Double = 0.0

    @Field
    var stage: String = ""
  }

  enum class Stage(val value: String) : Enumerable {
    STARTED("started"),
    COMPLETED("completed")
  }

  @Test
  fun delivers_one_int() = withSingleModule({
    Function("fire") { callback: Callback -> callback(42) }
  }) {
    callVoid("fire", "(value) => { globalThis.result = value }")
    Truth.assertThat(evaluateScript("globalThis.result").getInt()).isEqualTo(42)
  }

  @Test
  fun delivers_multiple_calls_in_order() = withSingleModule({
    Function("fire") { callback: Callback ->
      callback(1)
      callback(2)
      callback(3)
    }
  }) {
    callVoid("fire", "(value) => { globalThis.result = (globalThis.result ?? []).concat(value) }")
    Truth.assertThat(evaluateScript("JSON.stringify(globalThis.result)").getString()).isEqualTo("[1,2,3]")
  }

  @Test
  fun delivers_record_as_object() = withSingleModule({
    Function("fire") { callback: Callback ->
      callback(
        ProgressRecord().apply {
          percent = 0.5
          stage = "downloading"
        }
      )
    }
  }) {
    callVoid("fire", "(progress) => { globalThis.result = progress.stage + ':' + progress.percent }")
    Truth.assertThat(evaluateScript("globalThis.result").getString()).isEqualTo("downloading:0.5")
  }

  @Test
  fun delivers_enum_as_raw_value() = withSingleModule({
    Function("fire") { callback: Callback -> callback(Stage.COMPLETED) }
  }) {
    callVoid("fire", "(stage) => { globalThis.result = stage }")
    Truth.assertThat(evaluateScript("globalThis.result").getString()).isEqualTo("completed")
  }

  @Test
  fun delivers_two_arguments() = withSingleModule({
    Function("fire") { callback: Callback -> callback("Hello", 7) }
  }) {
    callVoid("fire", "(a, b) => { globalThis.result = a + '-' + b }")
    Truth.assertThat(evaluateScript("globalThis.result").getString()).isEqualTo("Hello-7")
  }

  @Test
  fun delivers_no_arguments() = withSingleModule({
    Function("fire") { callback: Callback -> callback() }
  }) {
    callVoid("fire", "(...args) => { globalThis.result = args.length }")
    Truth.assertThat(evaluateScript("globalThis.result").getInt()).isEqualTo(0)
  }

  // The test call invoker (`TestingSyncJSCallInvoker`) runs scheduled work inline, so these tests
  // verify conversion and delivery rather than the hop itself. The JS-thread hop is verified
  // manually in native-component-list.
  @Test
  fun delivers_from_background_thread_inside_async_function() = withSingleModule({
    AsyncFunction("fire") { callback: Callback ->
      val worker = Thread { callback("done") }
      worker.start()
      worker.join()
    }
  }) {
    callAsync("fire", "(value) => { globalThis.result = value }")
    Truth.assertThat(evaluateScript("globalThis.result").getString()).isEqualTo("done")
  }

  @Test
  fun rejects_a_non_function_argument() = withSingleModule({
    Function("fire") { callback: Callback -> callback(1) }
  }) {
    val exception = Assert.assertThrows(JavaScriptEvaluateException::class.java) {
      callVoid("fire", "42")
    }
    Truth.assertThat(exception.message).contains("Cannot convert")
  }

  @Test
  fun accepts_two_callbacks() = withSingleModule({
    Function("fire") { onProgress: Callback, onDone: Callback ->
      onProgress(1)
      onDone(2)
    }
  }) {
    val collect = "(value) => { globalThis.result = (globalThis.result ?? []).concat(value) }"
    callVoid("fire", "$collect, $collect")
    Truth.assertThat(evaluateScript("JSON.stringify(globalThis.result)").getString()).isEqualTo("[1,2]")
  }

  @Test
  fun accepts_nullable_callback() = withSingleModule({
    Function("fire") { callback: Callback? -> callback?.invoke("called") }
  }) {
    callVoid("fire", "(value) => { globalThis.result = value }")
    Truth.assertThat(evaluateScript("globalThis.result").getString()).isEqualTo("called")

    evaluateScript("delete globalThis.result")
    callVoid("fire", "undefined")
    Truth.assertThat(evaluateScript("typeof globalThis.result").getString()).isEqualTo("undefined")
  }

  @Test
  fun drops_calls_after_the_runtime_is_torn_down() {
    var captured: Callback? = null
    var pass = 0

    withSingleModule({
      Function("capture") { callback: Callback -> captured = callback }
    }, numberOfReloads = 2) {
      pass += 1
      if (pass == 1) {
        callVoid("capture", "() => {}")
        Truth.assertThat(captured).isNotNull()
      } else {
        // A fresh runtime, so the callback captured in the first pass outlived the runtime that
        // created it. Both calls must return without throwing.
        captured?.invoke(1)
        captured?.invoke()
      }
    }

    Truth.assertThat(pass).isEqualTo(2)
  }

  @Test
  fun works_next_to_other_arguments() = withSingleModule({
    Function("greet") { name: String, callback: Callback -> callback("Hello, $name!") }
  }) {
    callVoid("greet", "'Expo', (greeting) => { globalThis.result = greeting }")
    Truth.assertThat(evaluateScript("globalThis.result").getString()).isEqualTo("Hello, Expo!")
  }
}
