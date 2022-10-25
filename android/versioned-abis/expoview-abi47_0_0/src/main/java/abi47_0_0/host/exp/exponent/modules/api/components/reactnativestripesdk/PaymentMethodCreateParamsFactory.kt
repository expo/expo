package abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi47_0_0.com.facebook.react.bridge.ReadableMap
import abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapToBillingDetails
import abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapToUSBankAccountHolderType
import abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapToUSBankAccountType
import com.stripe.android.model.*

class PaymentMethodCreateParamsFactory(
  private val paymentMethodData: ReadableMap?,
  private val options: ReadableMap,
  private val cardFieldView: CardFieldView?,
  private val cardFormView: CardFormView?,
) {
  private val billingDetailsParams = mapToBillingDetails(getMapOrNull(paymentMethodData, "billingDetails"), cardFieldView?.cardAddress ?: cardFormView?.cardAddress)

  @Throws(PaymentMethodCreateParamsException::class)
  fun createPaymentMethodParams(paymentMethodType: PaymentMethod.Type): PaymentMethodCreateParams {
    try {
      return when (paymentMethodType) {
        PaymentMethod.Type.Card -> createCardPaymentMethodParams()
        PaymentMethod.Type.Ideal -> createIDEALParams()
        PaymentMethod.Type.Alipay -> createAlipayParams()
        PaymentMethod.Type.Sofort -> createSofortParams()
        PaymentMethod.Type.Bancontact -> createBancontactParams()
        PaymentMethod.Type.SepaDebit -> createSepaParams()
        PaymentMethod.Type.Oxxo -> createOXXOParams()
        PaymentMethod.Type.Giropay -> createGiropayParams()
        PaymentMethod.Type.Eps -> createEPSParams()
        PaymentMethod.Type.GrabPay -> createGrabPayParams()
        PaymentMethod.Type.P24 -> createP24Params()
        PaymentMethod.Type.Fpx -> createFpxParams()
        PaymentMethod.Type.AfterpayClearpay -> createAfterpayClearpayParams()
        PaymentMethod.Type.AuBecsDebit -> createAuBecsDebitParams()
        PaymentMethod.Type.Klarna -> createKlarnaParams()
        PaymentMethod.Type.USBankAccount -> createUSBankAccountParams(paymentMethodData)
        PaymentMethod.Type.PayPal -> createPayPalParams()
        PaymentMethod.Type.Affirm -> createAffirmParams()
        else -> {
          throw Exception("This paymentMethodType is not supported yet")
        }
      }
    } catch (error: PaymentMethodCreateParamsException) {
      throw error
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createIDEALParams(): PaymentMethodCreateParams {
    val bankName = getValOr(paymentMethodData, "bankName", null)

    val idealParams = PaymentMethodCreateParams.Ideal(bankName)
    return PaymentMethodCreateParams.create(ideal = idealParams, billingDetails = billingDetailsParams)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAlipayParams(): PaymentMethodCreateParams {
    return PaymentMethodCreateParams.createAlipay()
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSofortParams(): PaymentMethodCreateParams {
    val country = getValOr(paymentMethodData, "country", null) ?: run {
      throw PaymentMethodCreateParamsException("You must provide bank account country")
    }

    return PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Sofort(country = country),
      billingDetailsParams
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createBancontactParams(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      return PaymentMethodCreateParams.createBancontact(it)
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createSepaParams(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      val iban = getValOr(paymentMethodData, "iban", null) ?: run {
        throw PaymentMethodCreateParamsException("You must provide IBAN")
      }

      return PaymentMethodCreateParams.create(
        sepaDebit = PaymentMethodCreateParams.SepaDebit(iban),
        billingDetails = it
      )
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createOXXOParams(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      return PaymentMethodCreateParams.createOxxo(it)
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createGiropayParams(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      return PaymentMethodCreateParams.createGiropay(it)
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createEPSParams(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      return PaymentMethodCreateParams.createEps(it)
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createGrabPayParams(): PaymentMethodCreateParams {
    val billingDetails = billingDetailsParams ?: PaymentMethod.BillingDetails()
    return PaymentMethodCreateParams.createGrabPay(billingDetails)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createP24Params(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      return PaymentMethodCreateParams.createP24(it)
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createFpxParams(): PaymentMethodCreateParams {
    val bank = getBooleanOrFalse(paymentMethodData, "testOfflineBank").let { "test_offline_bank" }
    return PaymentMethodCreateParams.create(
      PaymentMethodCreateParams.Fpx(bank)
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAfterpayClearpayParams(): PaymentMethodCreateParams {
    billingDetailsParams?.let {
      return PaymentMethodCreateParams.createAfterpayClearpay(it)
    }

    throw PaymentMethodCreateParamsException("You must provide billing details")
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAuBecsDebitParams(): PaymentMethodCreateParams {
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

    return PaymentMethodCreateParams.create(
      auBecsDebit = PaymentMethodCreateParams.AuBecsDebit(
        bsbNumber = bsbNumber,
        accountNumber = accountNumber
      ),
      billingDetails = billingDetails
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createKlarnaParams(): PaymentMethodCreateParams {
    if (billingDetailsParams == null ||
      billingDetailsParams.address?.country.isNullOrBlank() ||
      billingDetailsParams.email.isNullOrBlank()
    ) {
      throw PaymentMethodCreateParamsException("Klarna requires that you provide the following billing details: email, country")
    }

    return PaymentMethodCreateParams.createKlarna(billingDetailsParams)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createPayPalParams(): PaymentMethodCreateParams {
    return PaymentMethodCreateParams.createPayPal(null)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAffirmParams(): PaymentMethodCreateParams {
    return PaymentMethodCreateParams.createAffirm(billingDetailsParams)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  fun createParams(clientSecret: String, paymentMethodType: PaymentMethod.Type?, isPaymentIntent: Boolean): ConfirmStripeIntentParams {
    try {
      return when (paymentMethodType) {
        PaymentMethod.Type.Card -> createCardStripeIntentParams(clientSecret, isPaymentIntent)
        PaymentMethod.Type.USBankAccount -> createUSBankAccountStripeIntentParams(clientSecret, isPaymentIntent)
        PaymentMethod.Type.PayPal -> createPayPalStripeIntentParams(clientSecret, isPaymentIntent)
        PaymentMethod.Type.Affirm -> createAffirmStripeIntentParams(clientSecret, isPaymentIntent)
        PaymentMethod.Type.Ideal,
        PaymentMethod.Type.Alipay,
        PaymentMethod.Type.Sofort,
        PaymentMethod.Type.Bancontact,
        PaymentMethod.Type.SepaDebit,
        PaymentMethod.Type.Oxxo,
        PaymentMethod.Type.Giropay,
        PaymentMethod.Type.Eps,
        PaymentMethod.Type.GrabPay,
        PaymentMethod.Type.P24,
        PaymentMethod.Type.Fpx,
        PaymentMethod.Type.AfterpayClearpay,
        PaymentMethod.Type.AuBecsDebit,
        PaymentMethod.Type.Klarna -> {
          val params = createPaymentMethodParams(paymentMethodType)

          return if (isPaymentIntent) {
            ConfirmPaymentIntentParams
              .createWithPaymentMethodCreateParams(
                paymentMethodCreateParams = params,
                clientSecret = clientSecret,
                setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
              )
          } else {
            ConfirmSetupIntentParams.create(
              paymentMethodCreateParams = params,
              clientSecret = clientSecret,
            )
          }
        }
        null -> ConfirmPaymentIntentParams.create(clientSecret)
        else -> {
          throw Exception("This paymentMethodType is not supported yet")
        }
      }
    } catch (error: PaymentMethodCreateParamsException) {
      throw error
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardPaymentMethodParams(): PaymentMethodCreateParams {
    val token = getValOr(paymentMethodData, "token", null)
    var cardParams = cardFieldView?.cardParams ?: cardFormView?.cardParams

    if (token != null) {
      cardParams = PaymentMethodCreateParams.Card.create(token)
    }

    if (cardParams == null) {
      throw PaymentMethodCreateParamsException("Card details not complete")
    }

    return PaymentMethodCreateParams.create(cardParams, billingDetailsParams)
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createCardStripeIntentParams(clientSecret: String, isPaymentIntent: Boolean): ConfirmStripeIntentParams {
    val paymentMethodId = getValOr(paymentMethodData, "paymentMethodId", null)
    val setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))

    if (paymentMethodId != null) {
      val cvc = getValOr(paymentMethodData, "cvc", null)
      val paymentMethodOptionParams =
        if (cvc != null) PaymentMethodOptionsParams.Card(cvc) else null

      return (
        if (isPaymentIntent)
          ConfirmPaymentIntentParams.createWithPaymentMethodId(
            paymentMethodId,
            paymentMethodOptions = paymentMethodOptionParams,
            clientSecret = clientSecret,
            setupFutureUsage = setupFutureUsage
          )
        else
          ConfirmSetupIntentParams.create(
            paymentMethodId,
            clientSecret
          )
        )
    } else {
      val paymentMethodCreateParams = createCardPaymentMethodParams()
      return (
        if (isPaymentIntent)
          ConfirmPaymentIntentParams
            .createWithPaymentMethodCreateParams(
              paymentMethodCreateParams,
              clientSecret,
              setupFutureUsage = setupFutureUsage
            )
        else
          ConfirmSetupIntentParams
            .create(paymentMethodCreateParams, clientSecret)
        )
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createUSBankAccountStripeIntentParams(clientSecret: String, isPaymentIntent: Boolean): ConfirmStripeIntentParams {
    // If payment method data is supplied, assume they are passing in the bank details manually
    paymentMethodData?.let {
      if (billingDetailsParams?.name.isNullOrBlank()) {
        throw PaymentMethodCreateParamsException("When creating a US bank account payment method, you must provide the following billing details: name")
      }
      return if (isPaymentIntent) {
        ConfirmPaymentIntentParams.createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = createUSBankAccountParams(paymentMethodData),
          clientSecret,
          setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage"))
        )
      } else {
        ConfirmSetupIntentParams.create(
          paymentMethodCreateParams = createUSBankAccountParams(paymentMethodData),
          clientSecret = clientSecret,
        )
      }
    } ?: run {
      // Payment method is assumed to be already attached through via collectBankAccount
      return if (isPaymentIntent) {
        ConfirmPaymentIntentParams.create(
          clientSecret = clientSecret,
          paymentMethodType = PaymentMethod.Type.USBankAccount
        )
      } else {
        ConfirmSetupIntentParams.create(
          clientSecret = clientSecret,
          paymentMethodType = PaymentMethod.Type.USBankAccount
        )
      }
    }
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createPayPalStripeIntentParams(clientSecret: String, isPaymentIntent: Boolean): ConfirmStripeIntentParams {
    if (!isPaymentIntent) {
      throw PaymentMethodCreateParamsException("PayPal is not yet supported through SetupIntents.")
    }

    val params = createPayPalParams()

    return ConfirmPaymentIntentParams.createWithPaymentMethodCreateParams(
      paymentMethodCreateParams = params,
      clientSecret = clientSecret,
    )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createAffirmStripeIntentParams(clientSecret: String, isPaymentIntent: Boolean): ConfirmStripeIntentParams {
    if (!isPaymentIntent) {
      throw PaymentMethodCreateParamsException("Affirm is not yet supported through SetupIntents.")
    }

    val params = createAffirmParams()

    return ConfirmPaymentIntentParams
      .createWithPaymentMethodCreateParams(
        paymentMethodCreateParams = params,
        clientSecret = clientSecret,
        setupFutureUsage = mapToPaymentIntentFutureUsage(getValOr(options, "setupFutureUsage")),
      )
  }

  @Throws(PaymentMethodCreateParamsException::class)
  private fun createUSBankAccountParams(params: ReadableMap?): PaymentMethodCreateParams {
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
          null
        )
      ),
      mapToUSBankAccountHolderType(
        getValOr(
          params,
          "accountHolderType",
          null
        )
      )
    )

    return PaymentMethodCreateParams.Companion.create(
      usBankAccount,
      billingDetailsParams,
      null
    )
  }
}

class PaymentMethodCreateParamsException(message: String) : Exception(message)
