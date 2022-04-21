package abi45_0_0.expo.modules.kotlin

import abi45_0_0.expo.modules.kotlin.types.JSTypeConverter

class KPromiseWrapper(
  private val bridgePromise: abi45_0_0.com.facebook.react.bridge.Promise
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
