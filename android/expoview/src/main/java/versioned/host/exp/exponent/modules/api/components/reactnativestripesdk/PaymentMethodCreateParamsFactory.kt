package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import com.facebook.react.bridge.ReadableMap
import com.stripe.android.model.*

class PaymentMethodCreateParamsFactory(
  private val clientSecret: String,
  private val paymentMethodData: ReadableMap?,
  private val options: ReadableMap,
  private val cardFieldView: CardFieldView?,
  private val cardFormView: CardFormView?,
) {
  private val billingDetailsParams = mapToBillingDetails(getMapOrNull(paymentMethodData, "billingDetails"), cardFieldView?.cardAddress ?: cardFormView?.cardAddress)

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
        PaymentMethod.Type.USBankAccount -> createUSBankAccountPaymentConfirmParams()
        PaymentMethod.Type.PayPal -> createPayPalPaymentConfirmParams()
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
        PaymentMethod.Type.USBankAccount -> createUSBankAccountPaymentSetupParams()
        PaymentMethod.Type.PayPal -> createPayPalPaymentSetupParams()
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
    val bankName = getValOr(paymentMethodData, "bankName", null)

    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    val createParams =
      PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = createParams,
        clientSecret = clientSecret,
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
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
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val paymentMethodId = getValOr(paymentMethodData, "paymentMethodId", null)
    val token = getValOr(paymentMethodData, "token", null)

    val cardParams = cardFieldView?.cardParams ?: cardFormView?.cardParams

    if (cardParams == null && paymentMethodId == null && token == null) {
      throw PaymentMethodCreateParamsException("Card details not complete")
    }

    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))

    if (paymentMethodId != null) {
      val cvc = getValOr(paymentMethodData, "cvc", null)
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
    val bankName = getValOr(paymentMethodData, "bankName", null)

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
      val iban = getValOr(paymentMethodData, "iban", null) ?: run {
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
    val paymentMethodId = getValOr(paymentMethodData, "paymentMethodId", null)
    val token = getValOr(paymentMethodData, "token", null)
    val cardParams = cardFieldView?.cardParams ?: cardFormView?.cardParams

    if (paymentMethodId != null) {
      return ConfirmSetupIntentParams.create(
        paymentMethodId,
        clientSecret
      )
    }

    val paymentMethodCreateParams =
      if (token != null)
        PaymentMethodCreateParams.create(PaymentMethodCreateParams.Card.create(token), billingDetailsParams)
      else if (cardParams != null)
        PaymentMethodCreateParams.create(cardParams, billingDetailsParams)
      else
        null

    if (paymentMethodCreateParams != null) {
      return ConfirmSetupIntentParams
        .create(paymentMethodCreateParams, clientSecret)
    } else {
      throw PaymentMethodCreateParamsException("Card details not complete")
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAlipayPaymentConfirmParams(): ConfirmPaymentIntentParams {
    return ConfirmPaymentIntentParams.createAlipay(clientSecret)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val country = getValOr(paymentMethodData, "country", null) ?: run {
      throw PaymentMethodCreateParamsException("You must provide bank account country")
    }

    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Sofort(country = country),
      billingDetailsParams
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortPaymentSetupParams(): ConfirmSetupIntentParams {
    val country = getValOr(paymentMethodData, "country", null)
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
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createBancontactPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val params = PaymentMethodCreateParams.createBancontact(it)

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
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
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
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
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
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
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSepaPaymentConfirmParams(): ConfirmPaymentIntentParams {
    billingDetailsParams?.let {
      val iban = getValOr(paymentMethodData, "iban", null) ?: run {
        throw PaymentMethodCreateParamsException("You must provide IBAN")
      }

      val params = PaymentMethodCreateParams.create(
        sepaDebit = PaymentMethodCreateParams.SepaDebit(iban),
        billingDetails = it
      )

      return ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = params,
          clientSecret = clientSecret,
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createFpxPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val bank = getBooleanOrFalse(paymentMethodData, "testOfflineBank").let { "test_offline_bank" }
    val params = PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Fpx(bank)
    )

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
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
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
        )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAuBecsDebitPaymentConfirmParams(): ConfirmPaymentIntentParams {
    val formDetails = getMapOrNull(paymentMethodData, "formDetails") ?: run {
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
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAuBecsDebitPaymentSetupParams(): ConfirmSetupIntentParams {
    val formDetails = getMapOrNull(paymentMethodData, "formDetails") ?: run {
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
  private fun createUSBankAccountPaymentSetupParams(): ConfirmSetupIntentParams {
    // If payment method data is supplied, assume they are passing in the bank details manually
    paymentMethodData?.let {
      if (billingDetailsParams?.name.isNullOrBlank()) {
        throw PaymentMethodCreateParamsException("When creating a US bank account payment method, you must provide the following billing details: name")
      }
      return ConfirmSetupIntentParams.create(
        paymentMethodCreateParams = createUSBankAccountParams(paymentMethodData),
        clientSecret = clientSecret,
      )
    } ?: run {
      // Payment method is assumed to be already attached through via collectBankAccount
      return ConfirmSetupIntentParams.create(
        clientSecret = clientSecret,
        paymentMethodType = PaymentMethod.Type.USBankAccount
      )
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createPayPalPaymentSetupParams(): ConfirmSetupIntentParams {
    throw PaymentMethodCreateParamsException("PayPal is not yet supported through SetupIntents.")
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
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createUSBankAccountPaymentConfirmParams(): ConfirmPaymentIntentParams {
    // If payment method data is supplied, assume they are passing in the bank details manually
    paymentMethodData?.let {
      if (billingDetailsParams?.name.isNullOrBlank()) {
        throw PaymentMethodCreateParamsException("When creating a US bank account payment method, you must provide the following billing details: name")
      }

      return ConfirmPaymentIntentParams.createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = createUSBankAccountParams(paymentMethodData),
        clientSecret,
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
      )
    } ?: run {
      // Payment method is assumed to be already attached through via collectBankAccount
      return ConfirmPaymentIntentParams.create(
        clientSecret = clientSecret,
        paymentMethodType = PaymentMethod.Type.USBankAccount
      )
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createPayPalPaymentConfirmParams(): ConfirmPaymentIntentParams {
    return ConfirmPaymentIntentParams.createWithPaymentMethodCreateParams(
      paymentMethodCreateParams = PaymentMethodCreateParams.createPayPal(null),
      clientSecret = clientSecret,
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createUSBankAccountParams(params: ReadableMap): PaymentMethodCreateParams {
    val accountNumber = getValOr(params, "accountNumber", null)
    val routingNumber = getValOr(params, "routingNumber", null)

    if (accountNumber.isNullOrBlank()) {
      throw PaymentMethodCreateParamsException("When creating a US bank account payment method, you must provide the bank account number")
    } else if (routingNumber.isNullOrBlank()) {
      throw PaymentMethodCreateParamsException("When creating a US bank account payment method, you must provide the bank routing number")
    }

    val usBankAccount = PaymentMethodCreateParams.USBankAccount(
      accountNumber,
      routingNumber,
      mapToUSBankAccountType(
        getValOr(
          params,
          "accountType",
          null)),
      mapToUSBankAccountHolderType(
        getValOr(
          params,
          "accountHolderType",
          null))
    )

    return PaymentMethodCreateParams.Companion.create(
      usBankAccount,
      billingDetailsParams,
      null
    )
  }
}

class PaymentMethodCreateParamsException(message: String) : Exception(message)
