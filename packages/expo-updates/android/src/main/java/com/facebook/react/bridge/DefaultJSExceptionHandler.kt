package com.facebook.react.bridge

/** Crashy crashy exception handler. */
open class DefaultJSExceptionHandler : JSExceptionHandler {
  override fun handleException(e: Exception) {
    throw if (e is RuntimeException) {
      // Because we are rethrowing the original exception, the original stacktrace will be
      // preserved.
      e
    } else {
      RuntimeException(e)
    }
  }
}