package expo.modules.test.core.legacy

import android.os.Bundle
import expo.modules.kotlin.exception.CodedException
import org.junit.Assert
import java.lang.reflect.UndeclaredThrowableException
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

/**
 * Asserts that provided [exception] is a [CodedException]
 */
@OptIn(ExperimentalContracts::class)
fun assertCodedException(exception: Throwable?) {
  contract {
    returns() implies (exception is CodedException)
  }

  Assert.assertNotNull("Expected exception, received null", exception)

  if (exception is UndeclaredThrowableException) {
    Assert.fail(
      "Expected CodedException, got UndeclaredThrowableException. " +
        "Did you forget to add '@Throws' annotations to module test interface methods?"
    )
  }

  if (exception !is CodedException) {
    Assert.fail(
      "Expected CodedException, got ${exception!!::class.simpleName}. " +
        "Full stack trace:\n${exception.stackTraceToString()}"
    )
  }
}

/**
 * Asserts that provided [exception] is a [CodedException] and then executes a block with
 * the [exception] as an argument
 */
@OptIn(ExperimentalContracts::class)
inline fun assertCodedException(exception: Throwable?, block: (exception: CodedException) -> Unit) {
  contract {
    callsInPlace(block, InvocationKind.EXACTLY_ONCE)
  }
  assertCodedException(exception)
  block(exception)
}

fun assertResolved(promise: PromiseMock) {
  Assert.assertEquals(PromiseState.RESOLVED, promise.state)
}

fun assertRejected(promise: PromiseMock) {
  Assert.assertEquals(PromiseState.REJECTED, promise.state)
}

fun promiseResolved(promise: PromiseMock, with: (Bundle) -> Unit) {
  assertResolved(promise)
  with(promise.resolveValue as Bundle)
}

inline fun <reified T> promiseResolvedWithType(promise: PromiseMock, with: (T) -> Unit) {
  assertResolved(promise)
  Assert.assertTrue("Promise resolved with incorrect type", promise.resolveValue is T)
  with(promise.resolveValue as T)
}

fun promiseRejected(promise: PromiseMock, with: (PromiseMock) -> Unit) {
  assertRejected(promise)
  with(promise)
}

fun assertRejectedWithCode(promise: PromiseMock, rejectCode: String) {
  promiseRejected(promise) {
    Assert.assertTrue("Promise has no rejection code", it.rejectCodeSet)
    Assert.assertEquals(it.rejectCode, rejectCode)
  }
}
