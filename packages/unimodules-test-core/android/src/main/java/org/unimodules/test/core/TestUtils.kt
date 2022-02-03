package org.unimodules.test.core

import android.os.Bundle
import junit.framework.ComparisonFailure
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import expo.modules.core.arguments.MapArguments
import expo.modules.core.arguments.ReadableArguments

fun assertSetsEqual(first: Set<*>, second: Set<*>, message: String = "") {
  if (!first.all { second.contains(it) }) {
    throw ComparisonFailure(message, first.toString(), second.toString())
  }
}

fun assertListsEqual(first: List<*>?, second: List<*>?, message: String = "") {
  if (first == second) return

  if (first == null || second == null) {
    throw throw ComparisonFailure(message, first.toString(), second.toString())
  }

  if (!first.toTypedArray().contentDeepEquals(second.toTypedArray())) {
    throw ComparisonFailure(message, first.toString(), second.toString())
  }
}

fun assertResolved(promise: PromiseMock) {
  assertEquals(PromiseState.RESOLVED, promise.state)
}

fun assertRejected(promise: PromiseMock) {
  assertEquals(PromiseState.REJECTED, promise.state)
}

fun promiseResolved(promise: PromiseMock, with: (Bundle) -> Unit) {
  assertResolved(promise)
  with(promise.resolveValue as Bundle)
}

inline fun <reified T> promiseResolvedWithType(promise: PromiseMock, with: (T) -> Unit) {
  assertResolved(promise)
  assertTrue("Promise resolved with incorrect type", promise.resolveValue is T)
  with(promise.resolveValue as T)
}

fun promiseRejected(promise: PromiseMock, with: (PromiseMock) -> Unit) {
  assertRejected(promise)
  with(promise)
}

fun assertRejectedWithCode(promise: PromiseMock, rejectCode: String) {
  promiseRejected(promise) {
    assertTrue("Promise has no rejection code", it.rejectCodeSet)
    assertEquals(it.rejectCode, rejectCode)
  }
}

fun readableArgumentsOf(values: Map<String, Any>): ReadableArguments {
  return MapArguments(values)
}

fun assertStringValueNull(bundle: Bundle, key: String) {
  assertTrue(bundle.containsKey(key))
  assertEquals(null, bundle.getString(key))
}
