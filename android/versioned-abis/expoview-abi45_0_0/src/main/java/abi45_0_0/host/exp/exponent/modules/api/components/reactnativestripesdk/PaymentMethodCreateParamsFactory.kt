package abi45_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi45_0_0.com.facebook.react.bridge.ReadableMap
import com.stripe.android.model.*

class PaymentMethodCreateParamsFactory(
  private val clientSecret: String,
  private val params: ReadableMap,
  private val cardFieldView: CardFieldView?,
  private val cardFormView: CardFormView?,
) {
  private val billingDetailsParams = mapToBillingDetails(getMapOrNull(params, "billingDetails"), cardFieldView?.cardAddress ?: cardFormView?.cardAddress)

  @Throws(PaymentMethodCreateParamsException::class)
  fun createConfirmParams(paymentMethodType: PaymentMethod.Type): ConfirmPaymentIntentParams {
    try {
      return when (paymentMethodType) {
        PaymentMethod.Type.Card -> createCardPaymentConfirmParams()
        PaymentMethod.Type.Ideal -> createIDEALPaymentConfirmParams()
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
        PaymentMethod.Type.AuBecsDebit -> createAuBecsDebitPaymentConfirmParams()
        PaymentMethod.Type.Klarna -> createKlarnaPaymentConfirmParams()
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
        PaymentMethod.Type.AuBecsDebit -> createAuBecsDebitPaymentSetupParams()
        else -> {
          throw Exception("This paymentMethodType is not supported yet")
        }
      }
    } catch (error: PaymentMethodCreateParamsException) {
      throw error
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createIDEALPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val bankName = getValOr(params, "bankName", null)

    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    val createParams =
      PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = createParams,
        clientSecret = clientSecret,
        setupFutureUsage = setupFutureUsage,
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createP24PaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createP24(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val paymentMethodId = getValOr(params, "paymentMethodId", null)
    val token = getValOr(params, "token", null)

    val cardParams = cardFieldView?.cardParams ?: cardFormView?.cardParams

    if (cardParams == null && paymentMethodId == null && token == null) {
      throw PaymentMethodCreateParamsException("Card details not complete")
    }

    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))

    if (paymentMethodId != null) {
      val cvc = getValOr(params, "cvc", null)
      val paymentMethodOptionParams =
        if (cvc != null) PaymentMethodOptionsParams.Card(cvc) else null

      return ConfirmPaymentIntentParams.createWithPaymentMethodId(
        paymentMethodId = paymentMethodId,
        paymentMethodOptions = paymentMethodOptionParams,
        clientSecret = clientSecret,
        setupFutureUsage = setupFutureUsage,
      )
    } else {
      var card = cardParams
      if (token != null) {
        card = PaymentMethodCreateParams.Card.create(token)
      }

      val paymentMethodCreateParams = PaymentMethodCreateParams.create(card!!, billingDetailsParams)
      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = paymentMethodCreateParams,
          clientSecret = clientSecret,
          setupFutureUsage = setupFutureUsage,
        )
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createIDEALPaymentSetupParams(): ConfirmSetupIntentParams {
    val bankName = getValOr(params, "bankName", null)

    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    val createParams =
      PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)

    return ConfirmSetupIntentParams.create(
      paymentMethodCreateParams = createParams,
      clientSecret = clientSecret,
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSepaPaymentSetupParams(): ConfirmSetupIntentParams {
    billingDetailsParams?.let {
      val iban = getValOr(params, "iban", null) ?: run {
        throw PaymentMethodCreateParamsException("You must provide IBAN")
      }

      val sepaParams = PaymentMethodCreateParams.SepaDebit(iban)
      val createParams =
        PaymentMethodCreateParams.create(
          sepaDebit = sepaParams,
          billingDetails = it
        )

      return ConfirmSetupIntentParams.create(
        paymentMethodCreateParams = createParams,
        clientSecret = clientSecret
      )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardPaymentSetupParams(): ConfirmSetupIntentParams {
    val cardParams = cardFieldView?.cardParams ?: cardFormView?.cardParams
      ?: throw PaymentMethodCreateParamsException("Card details not complete")

    val paymentMethodCreateParams =
      PaymentMethodCreateParams.create(cardParams, billingDetailsParams)

    return ConfirmSetupIntentParams
      .create(paymentMethodCreateParams, clientSecret)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAlipayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    return ConfirmPaymentIntentParams.createAlipay(clientSecret)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val country = getValOr(params, "country", null) ?: run {
      throw PaymentMethodCreateParamsException("You must provide bank account country")
    }
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))

    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Sofort(country = country),
      billingDetailsParams
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        setupFutureUsage = setupFutureUsage,
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortPaymentSetupParams(): ConfirmSetupIntentParams {
    val country = getValOr(params, "country", null)
      ?: throw PaymentMethodCreateParamsException("You must provide country")

    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Sofort(country = country),
      billingDetailsParams
    )

    return ConfirmSetupIntentParams.create(
      paymentMethodCreateParams = params,
      clientSecret = clientSecret,
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createGrabPayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val billingDetails = billingDetailsParams ?: PaymentMethod.BillingDetails()
    val params = PaymentMethodCreateParams.createGrabPay(billingDetails)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createBancontactPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage", null))
      val params = PaymentMethodCreateParams.createBancontact(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
          setupFutureUsage = setupFutureUsage,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  private fun createBancontactPaymentSetupParams(): ConfirmSetupIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createBancontact(it)

      return ConfirmSetupIntentParams
        .create(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createOXXOPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createOxxo(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createEPSPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createEps(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createGiropayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createGiropay(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSepaPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val iban = getValOr(params, "iban", null) ?: run {
        throw PaymentMethodCreateParamsException("You must provide IBAN")
      }
      val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(params, "setupFutureUsage"))
      val params = PaymentMethodCreateParams.create(
        sepaDebit = PaymentMethodCreateParams.SepaDebit(iban),
        billingDetails = it
      )

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
          setupFutureUsage = setupFutureUsage
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createFpxPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val bank = getBooleanOrFalse(params, "testOfflineBank").let { "test_offline_bank" }
    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Fpx(bank)
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAfterpayClearpayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createAfterpayClearpay(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAuBecsDebitPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val formDetails = getMapOrNull(params, "formDetails") ?: run {
      throw PaymentMethodCreateParamsException("You must provide form details")
    }

    val bsbNumber = getValOr(formDetails, "bsbNumber") as String
    val accountNumber = getValOr(formDetails, "accountNumber") as String
    val name = getValOr(formDetails, "name") as String
    val email = getValOr(formDetails, "email") as String

    val billingDetails = PaymentMethod.BillingDetails.Builder()
      .setName(name)
      .setEmail(email)
      .build()

    val params = PaymentMethodCreateParams.create(
      auBecsDebit = PaymentMethodCreateParams.AuBecsDebit(
        bsbNumber = bsbNumber,
        accountNumber = accountNumber
      ),
      billingDetails = billingDetails
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAuBecsDebitPaymentSetupParams(): ConfirmSetupIntentParams {
    val formDetails = getMapOrNull(params, "formDetails") ?: run {
      throw PaymentMethodCreateParamsException("You must provide form details")
    }

    val bsbNumber = getValOr(formDetails, "bsbNumber") as String
    val accountNumber = getValOr(formDetails, "accountNumber") as String
    val name = getValOr(formDetails, "name") as String
    val email = getValOr(formDetails, "email") as String

    val billingDetails = PaymentMethod.BillingDetails.Builder()
      .setName(name)
      .setEmail(email)
      .build()

    val params = PaymentMethodCreateParams.create(
      auBecsDebit = PaymentMethodCreateParams.AuBecsDebit(
        bsbNumber = bsbNumber,
        accountNumber = accountNumber
      ),
      billingDetails = billingDetails
    )

    return ConfirmSetupIntentParams
      .create(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createKlarnaPaymentConfirmParams(): ConfirmPaymentIntentParams {
    if (billingDetailsParams == null ||
      billingDetailsParams.address?.country.isNullOrBlank() ||
      billingDetailsParams.email.isNullOrBlank()
    ) {
      throw PaymentMethodCreateParamsException("Klarna requires that you provide the following billing details: email, country")
    }

    val params = PaymentMethodCreateParams.createKlarna(billingDetailsParams)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
      )
  }
}

class PaymentMethodCreateParamsException(message: String) : Exception(message)
