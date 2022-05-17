package expo.modules.test.core

import expo.modules.kotlin.exception.CodedException
import org.junit.Assert
import java.lang.reflect.UndeclaredThrowableException

fun assertResolved(promise: PromiseMock) {
  Assert.assertEquals(PromiseState.RESOLVED, promise.state)
}

fun assertRejected(promise: PromiseMock) {
  Assert.assertEquals(PromiseState.REJECTED, promise.state)
}

inline fun <reified ResolveType> promiseResolved(promise: PromiseMock, with: (ResolveType) -> Unit) {
  assertResolved(promise)
  Assert.assertTrue(
    "Promise resolved with incorrect type: ${ResolveType::class.simpleName}",
    promise.resolveValue is ResolveType
  )
  with(promise.resolveValue as ResolveType)
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

inline fun assertCodedException(exception: Throwable?, block: (exception: CodedException) -> Unit = {}) {
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
  block(exception as CodedException)
}
