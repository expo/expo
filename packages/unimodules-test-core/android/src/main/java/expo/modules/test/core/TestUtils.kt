package expo.modules.test.core

import org.junit.Assert

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
