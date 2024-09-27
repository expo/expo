package expo.modules.kotlin.functions

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
    override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
      convertArgs(args)
      throw NullPointerException()
    }
  }

  @Test
  fun `call should throw if pass more arguments then expected`() {
    val method = MockedAnyFunction(arrayOf({ typeOf<Int>() }.toAnyType<Int>()))
    val promise = PromiseMock()

    assertThrows<InvalidArgsNumberException>("Received 2 arguments, but 1 was expected") {
      method.callUserImplementation(
        arrayOf(1, 2),
        promise,
        mockk()
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }

  @Test
  fun `call should throw if pass less arguments then expected`() {
    val method = MockedAnyFunction(arrayOf({ typeOf<Int>() }.toAnyType<Int>(), { typeOf<Int>() }.toAnyType<Int>()))
    val promise = PromiseMock()

    assertThrows<InvalidArgsNumberException>("Received 1 arguments, but 2 was expected") {
      method.callUserImplementation(
        arrayOf(1),
        promise,
        mockk()
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
      The 1st argument cannot be cast to type kotlin.Int (received class java.lang.String)
      → Caused by: java.lang.ClassCastException: class java.lang.String cannot be cast to class java.lang.Integer (java.lang.String and java.lang.Integer are in module java.base of loader 'bootstrap')
      """.trimIndent()
    ) {
      method.callUserImplementation(
        arrayOf("STRING"),
        promise,
        mockk()
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }

  @Test
  fun `sync exception shouldn't be converter into promise rejection`() {
    val method = MockedAnyFunction(emptyArray())
    val promise = PromiseMock()

    assertThrows<NullPointerException> {
      method.callUserImplementation(
        emptyArray(),
        promise,
        mockk()
      )
    }

    Truth.assertThat(promise.state).isEqualTo(PromiseState.NONE)
  }
}
