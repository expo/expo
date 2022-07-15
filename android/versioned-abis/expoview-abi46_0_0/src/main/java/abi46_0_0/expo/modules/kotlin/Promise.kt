package abi46_0_0.expo.modules.kotlin

import abi46_0_0.expo.modules.kotlin.exception.CodedException

interface Promise {
  fun resolve(value: Any?)

  fun reject(code: String, message: String?, cause: Throwable?)

  fun reject(exception: CodedException) {
    reject(exception.code, exception.localizedMessage, exception.cause)
  }
}
