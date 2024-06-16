package expo.modules.kotlin.functions

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReadableArray
import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.assertThrows
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.ArgumentCastException
import expo.modules.kotlin.exception.InvalidArgsNumberException
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.toAnyType
import io.mockk.mockk
import org.junit.Test
import kotlin.reflect.typeOf

class AnyFunctionTest {
  class MockedAnyFunction(
    desiredArgsTypes: Array<AnyType>
  ) : AsyncFunction("my-method", desiredArgsTypes) {
    override fun callUserImplementation(args: ReadableArray, promise: Promise) {
      convertArgs(args)
      throw NullPointerException()
    }

    override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
      error("Not implemented.")
    }
  }

  @Test
  fun `call should throw if pass more arguments then expected`() {
    val method = MockedAnyFunction(arrayOf({ typeOf<Int>() }.toAnyType<Int>()))
    val promise = PromiseMock()

    assertThrows<InvalidArgsNumberException>("Received 2 arguments, but 1 was expected") {
      method.call(
        mockk(),
        JavaOnlyArray().apply {
          pushInt(1)
          pushInt(2)
        },
        promise
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }

  @Test
  fun `call should throw if pass less arguments then expected`() {
    val method = MockedAnyFunction(arrayOf({ typeOf<Int>() }.toAnyType<Int>(), { typeOf<Int>() }.toAnyType<Int>()))
    val promise = PromiseMock()

    assertThrows<InvalidArgsNumberException>("Received 1 arguments, but 2 was expected") {
      method.call(
        mockk(),
        JavaOnlyArray().apply {
          pushInt(1)
        },
        promise
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }

  @Test
  fun `call should throw if cannot convert args`() {
    val method = MockedAnyFunction(arrayOf({ typeOf<Int>() }.toAnyType<Int>()))
    val promise = PromiseMock()

    assertThrows<ArgumentCastException>(
      """
      The 1st argument cannot be cast to type kotlin.Int (received String)
      → Caused by: java.lang.ClassCastException: class java.lang.String cannot be cast to class java.lang.Number (java.lang.String and java.lang.Number are in module java.base of loader 'bootstrap')
      """.trimIndent()
    ) {
      method.call(
        mockk(),
        JavaOnlyArray().apply {
          pushString("STRING")
        },
        promise
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }

  @Test
  fun `sync exception shouldn't be converter into promise rejection`() {
    val method = MockedAnyFunction(emptyArray())
    val promise = PromiseMock()

    assertThrows<NullPointerException> {
      method.call(
        mockk(),
        JavaOnlyArray(),
        promise
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }
}
