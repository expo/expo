package expo.modules.kotlin

import android.os.Bundle
import com.facebook.react.bridge.Arguments

class KotlinPromiseWrapper(
  private val bridgePromise: com.facebook.react.bridge.Promise
) : Promise {

  override fun resolve(value: Any?) {
    when (value) {
      is Bundle -> {
        bridgePromise.resolve(Arguments.fromBundle(value as Bundle?))
      }
      is List<*> -> {
        bridgePromise.resolve(Arguments.fromList(value as List<*>?))
      }
      else -> {
        bridgePromise.resolve(value)
      }
    }
  }

  override fun reject(code: String, message: String?, cause: Throwable?) {
    bridgePromise.reject(code, message, cause)
  }
}
