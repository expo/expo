package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi44_0_0.com.facebook.react.bridge.WritableMap
import abi44_0_0.com.facebook.react.bridge.WritableNativeMap
import com.stripe.android.exception.APIException
import com.stripe.android.exception.AuthenticationException
import com.stripe.android.exception.CardException
import com.stripe.android.exception.InvalidRequestException
import com.stripe.android.model.PaymentIntent
import com.stripe.android.model.SetupIntent

enum class ConfirmPaymentErrorType {
  Failed, Canceled, Unknown
}

enum class CreateTokenErrorType {
  Failed
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

enum class RetrieveSetupIntentErrorType {
  Unknown
}

enum class PaymentSheetErrorType {
  Failed, Canceled
}

enum class GooglePayErrorType {
  Failed, Canceled, Unknown
}

internal fun mapError(code: String, message: String?, localizedMessage: String?, declineCode: String?, type: String?, stripeErrorCode: String?): WritableMap {
  val map: WritableMap = WritableNativeMap()
  val details: WritableMap = WritableNativeMap()
  details.putString("code", code)
  details.putString("message", message)
  details.putString("localizedMessage", localizedMessage)
  details.putString("declineCode", declineCode)
  details.putString("type", type)
  details.putString("stripeErrorCode", stripeErrorCode)

  map.putMap("error", details)
  return map
}

internal fun createError(code: String, message: String?): WritableMap {
  return mapError(code, message, message, null, null, null)
}

internal fun createError(code: String, error: PaymentIntent.Error?): WritableMap {
  return mapError(code, error?.message, error?.message, error?.declineCode, error?.type?.code, error?.code)
}

internal fun createError(code: String, error: SetupIntent.Error?): WritableMap {
  return mapError(code, error?.message, error?.message, error?.declineCode, error?.type?.code, error?.code)
}

internal fun createError(code: String, error: Exception): WritableMap {
  return when (error) {
    is CardException -> {
      mapError(code, error.message, error.localizedMessage, error.declineCode, error.stripeError?.type, error.stripeError?.code)
    }
    is InvalidRequestException -> {
      mapError(code, error.message, error.localizedMessage, error.stripeError?.declineCode, error.stripeError?.type, error.stripeError?.code)
    }
    is AuthenticationException -> {
      mapError(code, error.message, error.localizedMessage, error.stripeError?.declineCode, error.stripeError?.type, error.stripeError?.code)
    }
    is APIException -> {
      mapError(code, error.message, error.localizedMessage, error.stripeError?.declineCode, error.stripeError?.type, error.stripeError?.code)
    }
    else -> mapError(code, error.message, error.localizedMessage.orEmpty(), null, null, null)
  }
}

internal fun createError(code: String, error: Throwable): WritableMap {
  return mapError(code, error.message, error.localizedMessage, null, null, null)
}
