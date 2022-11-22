package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils

import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.stripe.android.core.exception.APIException
import com.stripe.android.core.exception.AuthenticationException
import com.stripe.android.core.exception.InvalidRequestException
import com.stripe.android.exception.CardException
import com.stripe.android.model.PaymentIntent
import com.stripe.android.model.SetupIntent

enum class ErrorType {
  Failed, Canceled, Unknown
}

enum class ConfirmPaymentErrorType {
  Failed, Canceled, Unknown
}

enum class CreateTokenErrorType {
  Failed
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
  Failed, Canceled
}

class PaymentSheetAppearanceException(message: String) : Exception(message)

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

internal fun createMissingActivityError(): WritableMap {
  return mapError(
    "Failed",
    "Activity doesn't exist yet. You can safely retry this method.",
    null,
    null,
    null,
    null)
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
  (error as? Exception)?.let {
    return createError(
      code,
      it)
  }
  return mapError(
    code,
    error.message,
    error.localizedMessage,
    null,
    null,
    null)
}

internal fun createMissingInitError(): WritableMap {
  return createError(ErrorType.Failed.toString(), "Stripe has not been initialized. Initialize Stripe in your app with the StripeProvider component or the initStripe method.")
}
