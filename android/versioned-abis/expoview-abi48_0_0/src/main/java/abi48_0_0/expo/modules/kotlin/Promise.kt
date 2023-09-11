package abi48_0_0.expo.modules.kotlin

import abi48_0_0.com.facebook.react.bridge.WritableMap
import abi48_0_0.expo.modules.kotlin.exception.CodedException
import abi48_0_0.expo.modules.kotlin.jni.PromiseImpl

private const val unknownCode = "UnknownCode"

interface Promise {
  fun resolve(value: Any?)

  fun reject(code: String, message: String?, cause: Throwable?)

  fun reject(exception: CodedException) {
    reject(exception.code, exception.localizedMessage, exception.cause)
  }
}

fun Promise.toBridgePromise(): abi48_0_0.com.facebook.react.bridge.Promise {
  val expoPromise = this
  val resolveMethod = if (expoPromise is PromiseImpl) {
    expoPromise.resolveBlock::invoke
  } else {
    expoPromise::resolve
  }

  return object : abi48_0_0.com.facebook.react.bridge.Promise {
    override fun resolve(value: Any?) {
      resolveMethod(value)
    }

    override fun reject(code: String?, message: String?) {
      expoPromise.reject(code ?: unknownCode, message, null)
    }

    override fun reject(code: String?, throwable: Throwable?) {
      expoPromise.reject(code ?: unknownCode, null, throwable)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?) {
      expoPromise.reject(code ?: unknownCode, message, throwable)
    }

    override fun reject(throwable: Throwable?) {
      expoPromise.reject(unknownCode, null, throwable)
    }

    override fun reject(throwable: Throwable?, userInfo: WritableMap?) {
      expoPromise.reject(unknownCode, null, throwable)
    }

    override fun reject(code: String?, userInfo: WritableMap) {
      expoPromise.reject(code ?: unknownCode, null, null)
    }

    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap?) {
      expoPromise.reject(code ?: unknownCode, null, throwable)
    }

    override fun reject(code: String?, message: String?, userInfo: WritableMap) {
      expoPromise.reject(code ?: unknownCode, message, null)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) {
      expoPromise.reject(code ?: unknownCode, message, throwable)
    }

    override fun reject(message: String?) {
      expoPromise.reject(unknownCode, message, null)
    }
  }
}
