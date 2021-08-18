// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.exceptions

import java.lang.Exception

abstract class ExponentException(private val originalException: Exception?) : Exception() {
  abstract override fun toString(): String

  fun originalException(): Exception? {
    return originalException
  }

  fun originalExceptionMessage(): String {
    return originalException?.toString() ?: toString()
  }
}
