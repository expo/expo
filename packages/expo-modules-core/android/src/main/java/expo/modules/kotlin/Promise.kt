package expo.modules.kotlin

import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.PromiseImpl

private const val unknownCode = "UnknownCode"

interface Promise {
  fun resolve(value: Any?)

  fun resolve() = resolve(null)

  fun resolve(result: Int) = resolve(result as Any?)

  fun resolve(result: Boolean) = resolve(result as Any?)

  fun resolve(result: Double) = resolve(result as Any?)

  fun resolve(result: Float) = resolve(result as Any?)

  fun resolve(result: String) = resolve(result as Any?)

  fun resolve(result: Collection<Any?>) = resolve(result as Any?)

  fun resolve(result: Map<String, Any?>) = resolve(result as Any?)

  fun reject(code: String, message: String?, cause: Throwable?)

  fun reject(exception: CodedException) {
    reject(exception.code, exception.localizedMessage, exception.cause)
  }
}

fun Promise.toBridgePromise(): com.facebook.react.bridge.Promise {
  val expoPromise = this
  val resolveMethod: (value: Any?) -> Unit = if (expoPromise is PromiseImpl) {
    expoPromise.callback::invoke
  } else {
    expoPromise::resolve
  }

  return object : com.facebook.react.bridge.Promise {
    override fun resolve(value: Any?) {
      resolveMethod(value)
    }

    override fun reject(code: String, message: String?) {
      expoPromise.reject(code, message, null)
    }

    override fun reject(code: String, throwable: Throwable?) {
      expoPromise.reject(code, null, throwable)
    }

    override fun reject(code: String, message: String?, throwable: Throwable?) {
      expoPromise.reject(code, message, throwable)
    }

    override fun reject(throwable: Throwable) {
      expoPromise.reject(unknownCode, null, throwable)
    }

    override fun reject(throwable: Throwable, userInfo: WritableMap) {
      expoPromise.reject(unknownCode, null, throwable)
    }

    override fun reject(code: String, userInfo: WritableMap) {
      expoPromise.reject(code, null, null)
    }

    override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) {
      expoPromise.reject(code, null, throwable)
    }

    override fun reject(code: String, message: String?, userInfo: WritableMap) {
      expoPromise.reject(code, message, null)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) {
      expoPromise.reject(code ?: unknownCode, message, throwable)
    }

    @Deprecated("Use reject(code, message, throwable) instead")
    override fun reject(message: String) {
      expoPromise.reject(unknownCode, message, null)
    }
  }
}
