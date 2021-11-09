package expo.modules.kotlin

import expo.modules.kotlin.exception.CodedException

interface Promise {
  fun resolve(value: Any?)

  fun reject(code: String, message: String?, cause: Throwable?)

  fun reject(exception: CodedException) {
    reject(exception.code, exception.message, exception.cause)
  }
}
