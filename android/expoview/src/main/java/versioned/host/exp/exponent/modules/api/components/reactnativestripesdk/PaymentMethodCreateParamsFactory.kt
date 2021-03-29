package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import com.facebook.react.bridge.ReadableMap
import com.stripe.android.model.*
import java.lang.Exception

class PaymentMethodCreateParamsFactory(private val clientSecret: String, private val params: ReadableMap, private val urlScheme: String?) {
  private val billingDetailsParams = mapToBillingDetails(getMapOrNull(params, "billingDetails"))

  @Throws(PaymentMethodCreateParamsException::class)
  fun createConfirmParams(paymentMethodType: PaymentMethod.Type): ConfirmPaymentIntentParams {
    try {
      return when (paymentMethodType) {
        PaymentMethod.Type.Card -> createCardPaymentConfirmParams()
        PaymentMethod.Type.Ideal -> createIDEALPaymentConfirmParams(paymentMethodType)
        PaymentMethod.Type.Alipay -> createAlipayPaymentConfirmParams()
        else -> {
          throw Exception("This paymentMethodType is not supported yet")
        }
      }
    } catch (error: PaymentMethodCreateParamsException) {
      throw error
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  fun createSetupParams(paymentMethodType: PaymentMethod.Type): ConfirmSetupIntentParams {
    try {
      return when (paymentMethodType) {
        PaymentMethod.Type.Card -> createCardPaymentSetupParams()
        PaymentMethod.Type.Ideal -> createIDEALPaymentSetupParams(paymentMethodType)
        else -> {
          throw Exception("This paymentMethodType is not supported yet")
        }
      }
    } catch (error: PaymentMethodCreateParamsException) {
      throw error
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createIDEALPaymentConfirmParams(paymentMethodType: PaymentMethod.Type): ConfirmPaymentIntentParams {
    val bankName = getValOr(params, "bankName", null) ?: throw PaymentMethodCreateParamsException("You must provide bankName")

    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }

    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    val createParams = PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = createParams,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val cardParams = getMapOrNull(params, "cardDetails")
    val paymentMethodId = getValOr(params, "paymentMethodId", null)

    if (cardParams == null && paymentMethodId == null) {
      throw PaymentMethodCreateParamsException("You must provide cardDetails or paymentMethodId")
    }

    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))

    if (paymentMethodId != null) {
      val cvc = getValOr(params, "cvc", null)
      val paymentMethodOptionParams = if (cvc != null) PaymentMethodOptionsParams.Card(cvc) else null

      return ConfirmPaymentIntentParams.createWithPaymentMethodId(
        paymentMethodId = paymentMethodId,
        paymentMethodOptions = paymentMethodOptionParams,
        clientSecret = clientSecret
      )
    } else {
      val card = mapToCard(cardParams!!)

      val createParams = PaymentMethodCreateParams
        .create(card, billingDetailsParams, null)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = createParams,
          clientSecret = clientSecret,
          setupFutureUsage = setupFutureUsage
        )
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createIDEALPaymentSetupParams(paymentMethodType: PaymentMethod.Type): ConfirmSetupIntentParams {
    val bankName = getValOr(params, "bankName", null) ?: throw PaymentMethodCreateParamsException("You must provide bankName")
    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    val createParams = PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)

    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }

    return ConfirmSetupIntentParams.create(
      paymentMethodCreateParams = createParams,
      clientSecret = clientSecret,
      returnUrl = mapToReturnURL(urlScheme)
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardPaymentSetupParams(): ConfirmSetupIntentParams {
    val cardParams = getMapOrNull(params, "cardDetails")

    val card = cardParams?.let { mapToCard(it) } ?: run {
      throw PaymentMethodCreateParamsException("You must provide cardDetails or paymentMethodId")
    }

    val paymentMethodParams = PaymentMethodCreateParams
      .create(card, billingDetailsParams, null)

    return ConfirmSetupIntentParams
      .create(paymentMethodParams, clientSecret)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAlipayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    return ConfirmPaymentIntentParams.createAlipay(clientSecret)
  }
}

class PaymentMethodCreateParamsException(message:String): Exception(message)
