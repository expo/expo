package org.unimodules.test.core

import android.os.Bundle
import junit.framework.Assert.assertEquals
import junit.framework.Assert.assertTrue
import junit.framework.ComparisonFailure
import org.unimodules.core.arguments.MapArguments
import org.unimodules.core.arguments.ReadableArguments

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

fun promiseResolved(promise: PromiseMock, with: (Bundle) -> Unit) {
  assertEquals(PromiseState.RESOLVED, promise.state)
  with(promise.resolveValue as Bundle)
}

fun promiseRejected(promise: PromiseMock, with: (PromiseMock) -> Unit) {
  assertEquals(PromiseState.REJECTED, promise.state)
  with(promise)
}

fun readableArgumentsOf(values: Map<String, Any>): ReadableArguments {
  return MapArguments(values)
}

fun assertStringValueNull(bundle: Bundle, key: String) {
  assertTrue(bundle.containsKey(key))
  assertEquals(null, bundle.getString(key))
}

