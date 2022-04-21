package abi45_0_0.expo.modules.kotlin

import abi45_0_0.expo.modules.kotlin.exception.CodedException

interface Promise {
  fun resolve(value: Any?)

  fun reject(code: String, message: String?, cause: Throwable?)

  fun reject(exception: CodedException) {
    reject(exception.code, exception.localizedMessage, exception.cause)
  }
}
