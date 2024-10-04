package expo.modules.kotlin

import expo.modules.kotlin.types.JSTypeConverter

class KPromiseWrapper(
  internal val bridgePromise: com.facebook.react.bridge.Promise
) : Promise {

  @Suppress("UNCHECKED_CAST")
  override fun resolve(value: Any?) {
    bridgePromise.resolve(
      JSTypeConverter.convertToJSValue(value)
    )
  }

  override fun reject(code: String, message: String?, cause: Throwable?) {
    bridgePromise.reject(code, message, cause)
  }
}
