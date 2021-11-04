@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.methods

import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.PromiseMock
import expo.modules.PromiseState
import expo.modules.kotlin.Promise
import org.junit.Test
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class AnyMethodTest {
  class MockedAnyMethod(desiredArgsTypes: Array<KType>) : AnyMethod("my-method", desiredArgsTypes) {
    override fun callImplementation(args: Array<out Any?>, promise: Promise) {
      throw NullPointerException()
    }
  }

  @Test
  fun `call should reject if pass more arguments then expected`() {
    val method = MockedAnyMethod(arrayOf(typeOf<Int>()))
    val promise = PromiseMock()

    method.call(
      JavaOnlyArray().apply {
        pushInt(1)
        pushInt(2)
      },
      promise
    )

    Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(promise.rejectCode).isEqualTo("ERR_INVALID_ARGS_NUMBER")
  }

  @Test
  fun `call should reject if pass less arguments then expected`() {
    val method = MockedAnyMethod(arrayOf(typeOf<Int>(), typeOf<Int>()))
    val promise = PromiseMock()

    method.call(
      JavaOnlyArray().apply {
        pushInt(1)
      },
      promise
    )

    Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(promise.rejectCode).isEqualTo("ERR_INVALID_ARGS_NUMBER")
  }

  @Test
  fun `call should reject if cannot convert args`() {
    val method = MockedAnyMethod(arrayOf(typeOf<Int>()))
    val promise = PromiseMock()

    method.call(
      JavaOnlyArray().apply {
        pushString("STRING")
      },
      promise
    )

    Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(promise.rejectCode).isEqualTo("ERR_INCOMPATIBLE_ARG_TYPE")
    Truth.assertThat(promise.rejectMessage).isEqualTo("Argument type kotlin.String is not compatible with expected type kotlin.Int.")
  }

  @Test
  fun `unknown exception should be wrapped into UnexpectedException`() {
    val method = MockedAnyMethod(emptyArray())
    val promise = PromiseMock()

    method.call(
      JavaOnlyArray(),
      promise
    )

    Truth.assertThat(promise.state).isEqualTo(PromiseState.REJECTED)
    Truth.assertThat(promise.rejectCode).isEqualTo("ERR_UNEXPECTED")
  }
}
