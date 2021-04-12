package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import com.facebook.react.bridge.ReadableMap
import com.stripe.android.model.*

class PaymentMethodCreateParamsFactory(private val clientSecret: String, private val params: ReadableMap, private val urlScheme: String?) {
  private val billingDetailsParams = mapToBillingDetails(getMapOrNull(params, "billingDetails"))

  @Throws(PaymentMethodCreateParamsException::class)
  fun createConfirmParams(paymentMethodType: PaymentMethod.Type): ConfirmPaymentIntentParams {
    try {
      return when (paymentMethodType) {
        PaymentMethod.Type.Card -> createCardPaymentConfirmParams()
        PaymentMethod.Type.Ideal -> createIDEALPaymentConfirmParams(paymentMethodType)
        PaymentMethod.Type.Alipay -> createAlipayPaymentConfirmParams()
        PaymentMethod.Type.Sofort -> createSofortPaymentConfirmParams()
        PaymentMethod.Type.Bancontact -> createBancontactPaymentConfirmParams()
        PaymentMethod.Type.SepaDebit -> createSepaPaymentConfirmParams()
        PaymentMethod.Type.Oxxo -> createOXXOPaymentConfirmParams()
        PaymentMethod.Type.Giropay -> createGiropayPaymentConfirmParams()
        PaymentMethod.Type.Eps -> createEPSPaymentConfirmParams()
        PaymentMethod.Type.GrabPay -> createGrabPayPaymentConfirmParams()
        PaymentMethod.Type.P24 -> createP24PaymentConfirmParams()
        PaymentMethod.Type.Fpx -> createFpxPaymentConfirmParams()
        PaymentMethod.Type.AfterpayClearpay -> createAfterpayClearpayPaymentConfirmParams()
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
        PaymentMethod.Type.Ideal -> createIDEALPaymentSetupParams()
        PaymentMethod.Type.Sofort -> createSofortPaymentSetupParams()
        PaymentMethod.Type.Bancontact -> createBancontactPaymentSetupParams()
        PaymentMethod.Type.SepaDebit -> createSepaPaymentSetupParams()
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
    val bankName = getValOr(params, "bankName", null)
      ?: throw PaymentMethodCreateParamsException("You must provide bankName")

    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }

    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    val createParams = PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = createParams,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme),
        setupFutureUsage = setupFutureUsage
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createP24PaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }

    val params = PaymentMethodCreateParams.createP24(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
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
  private fun createIDEALPaymentSetupParams(): ConfirmSetupIntentParams {
    val bankName = getValOr(params, "bankName", null)
      ?: throw PaymentMethodCreateParamsException("You must provide bankName")

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
  private fun createSepaPaymentSetupParams(): ConfirmSetupIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    val iban = getValOr(params, "iban", null)?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide IBAN")
    }

    val sepaParams = PaymentMethodCreateParams.SepaDebit(iban)
    val createParams = PaymentMethodCreateParams.create(sepaDebit = sepaParams, billingDetails = billingDetails)

    return ConfirmSetupIntentParams.create(
      paymentMethodCreateParams = createParams,
      clientSecret = clientSecret
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

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val country = getValOr(params, "country", null)?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide bank account country")
    }
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))

    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Sofort(country = country),
      billingDetailsParams
    )

    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme),
        setupFutureUsage = setupFutureUsage
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortPaymentSetupParams(): ConfirmSetupIntentParams {
    val country = getValOr(params, "country", null)
      ?: throw PaymentMethodCreateParamsException("You must provide country")

    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }

    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Sofort(country = country),
      billingDetailsParams
    )

    return ConfirmSetupIntentParams.create(
      paymentMethodCreateParams = params,
      clientSecret = clientSecret,
      returnUrl = mapToReturnURL(urlScheme)
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createGrabPayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }
    val billingDetails = billingDetailsParams ?: PaymentMethod.BillingDetails()
    val params = PaymentMethodCreateParams.createGrabPay(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createBancontactPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))
    val params = PaymentMethodCreateParams.createBancontact(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme),
        setupFutureUsage = setupFutureUsage
      )
  }

  private fun createBancontactPaymentSetupParams(): ConfirmSetupIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }
    val params = PaymentMethodCreateParams.createBancontact(billingDetails)

    return ConfirmSetupIntentParams
      .create(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createOXXOPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }
    val params = PaymentMethodCreateParams.createOxxo(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createEPSPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }
    val params = PaymentMethodCreateParams.createEps(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createGiropayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    if (urlScheme == null) {
      throw PaymentMethodCreateParamsException("You must provide urlScheme")
    }
    val params = PaymentMethodCreateParams.createGiropay(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSepaPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }
    val iban = getValOr(params, "iban", null)?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide IBAN")
    }
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))
    val params = PaymentMethodCreateParams.create(
      sepaDebit = PaymentMethodCreateParams.SepaDebit(iban),
      billingDetails = billingDetails
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        setupFutureUsage = setupFutureUsage
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createFpxPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val bank = getBooleanOrFalse(params, "testOfflineBank")?.let { "test_offline_bank" }
    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Fpx(bank)
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAfterpayClearpayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams?.let { it } ?: run {
      throw PaymentMethodCreateParamsException("You must provide billing details")
    }

    val params = PaymentMethodCreateParams.createAfterpayClearpay(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        returnUrl = mapToReturnURL(urlScheme)
      )
  }
}

class PaymentMethodCreateParamsException(message: String) : Exception(message)
