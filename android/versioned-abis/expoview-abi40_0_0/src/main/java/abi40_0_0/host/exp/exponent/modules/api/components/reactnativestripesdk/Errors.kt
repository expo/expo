package abi40_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi40_0_0.com.facebook.react.bridge.WritableMap
import abi40_0_0.com.facebook.react.bridge.WritableNativeMap

enum class ConfirmPaymentErrorType {
  Failed, Canceled, Unknown
}

enum class NextPaymentActionErrorType {
  Failed, Canceled, Unknown
}

enum class ConfirmSetupIntentErrorType {
  Failed, Canceled, Unknown
}

enum class RetrievePaymentIntentErrorType {
  Unknown
}

internal fun createError(errorType: String, message: String): WritableMap {
  val map: WritableMap = WritableNativeMap()
  map.putString("message", message)
  map.putString("code", errorType)

  return map
}
