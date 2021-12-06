package abi44_0_0.expo.modules.kotlin

import android.os.Bundle
import abi44_0_0.com.facebook.react.bridge.Arguments

class KPromiseWrapper(
  private val bridgePromise: abi44_0_0.com.facebook.react.bridge.Promise
) : Promise {

  override fun resolve(value: Any?) {
    bridgePromise.resolve(
      when (value) {
        is Unit -> null
        is Bundle -> Arguments.fromBundle(value as Bundle?)
        is List<*> -> Arguments.fromList(value as List<*>?)
        else -> value
      }
    )
  }

  override fun reject(code: String, message: String?, cause: Throwable?) {
    bridgePromise.reject(code, message, cause)
  }
}
