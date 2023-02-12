package abi48_0_0.expo.modules.kotlin

import abi48_0_0.expo.modules.kotlin.types.JSTypeConverter

class KPromiseWrapper(
  internal val bridgePromise: abi48_0_0.com.facebook.react.bridge.Promise
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
