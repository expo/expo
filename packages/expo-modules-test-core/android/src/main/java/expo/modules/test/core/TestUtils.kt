package expo.modules.test.core

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
