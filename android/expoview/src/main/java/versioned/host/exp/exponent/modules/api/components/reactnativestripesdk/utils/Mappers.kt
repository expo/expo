package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils

import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.*
import com.stripe.android.PaymentAuthConfig
import com.stripe.android.model.*
import com.stripe.android.model.StripeIntent.NextActionType
import com.stripe.android.model.StripeIntent.NextActionData

internal fun createResult(key: String, value: WritableMap): WritableMap {
  val map = WritableNativeMap()
  map.putMap(key, value)
  return map
}

internal fun createCanAddCardResult(canAddCard: Boolean, status: String? = null, token: WritableMap? = null): WritableNativeMap {
  val result = WritableNativeMap()
  val details = WritableNativeMap()
  result.putBoolean("canAddCard", canAddCard)
  if (status != null) {
    details.putString("status", status)
  }
  if (token != null) {
    details.putMap("token", token)
  }
  result.putMap("details", details)
  return result
}

internal fun mapIntentStatus(status: StripeIntent.Status?): String {
  return when (status) {
    StripeIntent.Status.Succeeded -> "Succeeded"
    StripeIntent.Status.RequiresPaymentMethod -> "RequiresPaymentMethod"
    StripeIntent.Status.RequiresConfirmation -> "RequiresConfirmation"
    StripeIntent.Status.Canceled -> "Canceled"
    StripeIntent.Status.Processing -> "Processing"
    StripeIntent.Status.RequiresAction -> "RequiresAction"
    StripeIntent.Status.RequiresCapture -> "RequiresCapture"
    else -> "Unknown"
  }
}


internal fun mapCaptureMethod(captureMethod: PaymentIntent.CaptureMethod?): String {
  return when (captureMethod) {
    PaymentIntent.CaptureMethod.Automatic -> "Automatic"
    PaymentIntent.CaptureMethod.Manual -> "Manual"
    else -> "Unknown"
  }
}

internal fun mapConfirmationMethod(captureMethod: PaymentIntent.ConfirmationMethod?): String {
  return when (captureMethod) {
    PaymentIntent.ConfirmationMethod.Automatic -> "Automatic"
    PaymentIntent.ConfirmationMethod.Manual -> "Manual"
    else -> "Unknown"
  }
}

internal fun mapToReturnURL(urlScheme: String?): String? {
  if (urlScheme != null) {
    return "$urlScheme://safepay"
  }
  return null
}

internal fun mapIntentShipping(shipping: PaymentIntent.Shipping): WritableMap {
  val map: WritableMap = WritableNativeMap()
  val address: WritableMap = WritableNativeMap()

  address.putString("city", shipping.address.city)
  address.putString("country", shipping.address.country)
  address.putString("line1", shipping.address.line1)
  address.putString("line2", shipping.address.line2)
  address.putString("postalCode", shipping.address.postalCode)
  address.putString("state", shipping.address.state)
  map.putMap("address", address)
  map.putString("name", shipping.name)
  map.putString("carrier", shipping.carrier)
  map.putString("phone", shipping.phone)
  map.putString("trackingNumber", shipping.trackingNumber)

  return map
}

internal fun mapCardBrand(brand: CardBrand?): String {
  return when (brand) {
    CardBrand.AmericanExpress -> "AmericanExpress"
    CardBrand.DinersClub -> "DinersClub"
    CardBrand.Discover -> "Discover"
    CardBrand.JCB -> "JCB"
    CardBrand.MasterCard -> "MasterCard"
    CardBrand.UnionPay -> "UnionPay"
    CardBrand.Visa -> "Visa"
    CardBrand.Unknown -> "Unknown"
    else -> "Unknown"
  }
}

internal fun mapPaymentMethodType(type: PaymentMethod.Type?): String {
  return when (type) {
    PaymentMethod.Type.AfterpayClearpay -> "AfterpayClearpay"
    PaymentMethod.Type.Alipay -> "Alipay"
    PaymentMethod.Type.AuBecsDebit -> "AuBecsDebit"
    PaymentMethod.Type.BacsDebit -> "BacsDebit"
    PaymentMethod.Type.Bancontact -> "Bancontact"
    PaymentMethod.Type.Card -> "Card"
    PaymentMethod.Type.CardPresent -> "CardPresent"
    PaymentMethod.Type.Eps -> "Eps"
    PaymentMethod.Type.Fpx -> "Fpx"
    PaymentMethod.Type.Giropay -> "Giropay"
    PaymentMethod.Type.GrabPay -> "GrabPay"
    PaymentMethod.Type.Ideal -> "Ideal"
    PaymentMethod.Type.Netbanking -> "Netbanking"
    PaymentMethod.Type.Oxxo -> "Oxxo"
    PaymentMethod.Type.P24 -> "P24"
    PaymentMethod.Type.SepaDebit -> "SepaDebit"
    PaymentMethod.Type.Sofort -> "Sofort"
    PaymentMethod.Type.Upi -> "Upi"
    PaymentMethod.Type.WeChatPay -> "WeChatPay"
    PaymentMethod.Type.Klarna -> "Klarna"
    PaymentMethod.Type.USBankAccount -> "USBankAccount"
    PaymentMethod.Type.PayPal -> "PayPal"
    PaymentMethod.Type.Affirm -> "Affirm"
    else -> "Unknown"
  }
}

internal fun mapToPaymentMethodType(type: String?): PaymentMethod.Type? {
  return when (type) {
    "Card" -> PaymentMethod.Type.Card
    "Ideal" -> PaymentMethod.Type.Ideal
    "Alipay" -> PaymentMethod.Type.Alipay
    "AuBecsDebit" -> PaymentMethod.Type.AuBecsDebit
    "BacsDebit" -> PaymentMethod.Type.BacsDebit
    "Bancontact" -> PaymentMethod.Type.Bancontact
    "AfterpayClearpay" -> PaymentMethod.Type.AfterpayClearpay
    "CardPresent" -> PaymentMethod.Type.CardPresent
    "Eps" -> PaymentMethod.Type.Eps
    "Fpx" -> PaymentMethod.Type.Fpx
    "Giropay" -> PaymentMethod.Type.Giropay
    "GrabPay" -> PaymentMethod.Type.GrabPay
    "Netbanking" -> PaymentMethod.Type.Netbanking
    "Oxxo" -> PaymentMethod.Type.Oxxo
    "P24" -> PaymentMethod.Type.P24
    "SepaDebit" -> PaymentMethod.Type.SepaDebit
    "Sofort" -> PaymentMethod.Type.Sofort
    "Upi" -> PaymentMethod.Type.Upi
    "WeChatPay" -> PaymentMethod.Type.WeChatPay
    "Klarna" -> PaymentMethod.Type.Klarna
    "USBankAccount" -> PaymentMethod.Type.USBankAccount
    "PayPal" -> PaymentMethod.Type.PayPal
    "Affirm" -> PaymentMethod.Type.Affirm
    else -> null
  }
}

internal fun mapFromBillingDetails(billingDatails: PaymentMethod.BillingDetails?): WritableMap {
  val details: WritableMap = WritableNativeMap()
  val address: WritableMap = WritableNativeMap()

  address.putString("country", billingDatails?.address?.country)
  address.putString("city", billingDatails?.address?.city)
  address.putString("line1", billingDatails?.address?.line1)
  address.putString("line2", billingDatails?.address?.line2)
  address.putString("postalCode", billingDatails?.address?.postalCode)
  address.putString("state", billingDatails?.address?.state)

  details.putString("email", billingDatails?.email)
  details.putString("phone", billingDatails?.phone)
  details.putString("name", billingDatails?.name)
  details.putMap("address", address)

  return details
}

internal fun mapTokenType(type: Token.Type): String {
  return when (type) {
    Token.Type.Account -> "Account"
    Token.Type.BankAccount -> "BankAccount"
    Token.Type.Card -> "Card"
    Token.Type.CvcUpdate -> "CvcUpdate"
    Token.Type.Person -> "Person"
    Token.Type.Pii -> "Pii"
    else -> "Unknown"
  }
}

internal fun mapFromBankAccountType(type: BankAccount.Type?): String {
  return when (type) {
    BankAccount.Type.Company -> "Company"
    BankAccount.Type.Individual -> "Individual"
    else -> "Unknown"
  }
}

internal fun mapToBankAccountType(type: String?): BankAccountTokenParams.Type {
  return when (type) {
    "Company" -> BankAccountTokenParams.Type.Company
    "Individual" -> BankAccountTokenParams.Type.Individual
    else -> BankAccountTokenParams.Type.Individual
  }
}

internal fun mapFromBankAccountStatus(status: BankAccount.Status?): String {
  return when (status) {
    BankAccount.Status.Errored -> "Errored"
    BankAccount.Status.New -> "New"
    BankAccount.Status.Validated -> "Validated"
    BankAccount.Status.VerificationFailed -> "VerificationFailed"
    BankAccount.Status.Verified -> "Verified"
    else -> "Unknown"
  }
}

internal fun mapFromBankAccount(bankAccount: BankAccount?): WritableMap? {
  if (bankAccount == null) {
    return null
  }

  val bankAccountMap: WritableMap = WritableNativeMap()
  bankAccountMap.putString("id", bankAccount.id)
  bankAccountMap.putString("bankName", bankAccount.bankName)
  bankAccountMap.putString("accountHolderName", bankAccount.accountHolderName)
  bankAccountMap.putString("accountHolderType", mapFromBankAccountType(bankAccount.accountHolderType))
  bankAccountMap.putString("currency", bankAccount.currency)
  bankAccountMap.putString("country", bankAccount.countryCode)
  bankAccountMap.putString("routingNumber", bankAccount.routingNumber)
  bankAccountMap.putString("status", mapFromBankAccountStatus(bankAccount.status))
  bankAccountMap.putString("fingerprint", bankAccount.fingerprint)
  bankAccountMap.putString("last4", bankAccount.last4)

  return bankAccountMap
}

internal fun mapToUSBankAccountHolderType(type: String?): PaymentMethod.USBankAccount.USBankAccountHolderType {
  return when (type) {
    "Company" -> PaymentMethod.USBankAccount.USBankAccountHolderType.COMPANY
    "Individual" -> PaymentMethod.USBankAccount.USBankAccountHolderType.INDIVIDUAL
    else -> PaymentMethod.USBankAccount.USBankAccountHolderType.INDIVIDUAL
  }
}

internal fun mapFromUSBankAccountHolderType(type: PaymentMethod.USBankAccount.USBankAccountHolderType?): String {
  return when (type) {
    PaymentMethod.USBankAccount.USBankAccountHolderType.COMPANY -> "Company"
    PaymentMethod.USBankAccount.USBankAccountHolderType.INDIVIDUAL -> "Individual"
    else -> "Unknown"
  }
}

internal fun mapToUSBankAccountType(type: String?): PaymentMethod.USBankAccount.USBankAccountType {
  return when (type) {
    "Savings" -> PaymentMethod.USBankAccount.USBankAccountType.SAVINGS
    "Checking" -> PaymentMethod.USBankAccount.USBankAccountType.CHECKING
    else -> PaymentMethod.USBankAccount.USBankAccountType.CHECKING
  }
}

internal fun mapFromUSBankAccountType(type: PaymentMethod.USBankAccount.USBankAccountType?): String {
  return when (type) {
    PaymentMethod.USBankAccount.USBankAccountType.CHECKING -> "Checking"
    PaymentMethod.USBankAccount.USBankAccountType.SAVINGS -> "Savings"
    else -> "Unknown"
  }
}

internal fun mapFromCard(card: Card?): WritableMap? {
  val cardMap: WritableMap = WritableNativeMap()

  if (card == null) {
    return null
  }

  val address: WritableMap = WritableNativeMap()

  cardMap.putString("country", card.country)
  cardMap.putString("brand", mapCardBrand(card.brand))
  cardMap.putString("currency", card.currency)

  (card.expMonth)?.let {
    cardMap.putInt("expMonth", it)
  } ?: run {
    cardMap.putNull("expMonth")
  }

  (card.expYear)?.let {
    cardMap.putInt("expYear", it)
  } ?: run {
    cardMap.putNull("expYear")
  }

  cardMap.putString("id", card.id)
  cardMap.putString("last4", card.last4)
  cardMap.putString("funding", card.funding?.name)
  cardMap.putString("name", card.name)

  address.putString("city", card.addressCity)
  address.putString("country", card.addressCountry)
  address.putString("line1", card.addressLine1)
  address.putString("line2", card.addressLine2)
  address.putString("state", card.addressState)
  address.putString("postalCode", card.addressZip)

  cardMap.putMap("address", address)

  return cardMap
}


internal fun mapFromToken(token: Token): WritableMap {
  val tokenMap: WritableMap = WritableNativeMap()
  tokenMap.putString("id", token.id)
  tokenMap.putDouble("created", token.created.time.toDouble())
  tokenMap.putString("type", mapTokenType(token.type))
  tokenMap.putBoolean("livemode", token.livemode)
  tokenMap.putMap("bankAccount", mapFromBankAccount(token.bankAccount))
  tokenMap.putMap("card", mapFromCard(token.card))
  tokenMap.putBoolean("used", token.used)

  return tokenMap
}

internal fun mapFromPaymentMethod(paymentMethod: PaymentMethod): WritableMap {
  val pm: WritableMap = WritableNativeMap()

  pm.putString("id", paymentMethod.id)
  pm.putString("paymentMethodType", mapPaymentMethodType(paymentMethod.type))
  pm.putBoolean("livemode", paymentMethod.liveMode)
  pm.putString("customerId", paymentMethod.customerId)
  pm.putMap("billingDetails", mapFromBillingDetails(paymentMethod.billingDetails))
  pm.putMap("Card", WritableNativeMap().also {
    it.putString("brand", mapCardBrand(paymentMethod.card?.brand))
    it.putString("country", paymentMethod.card?.country)
    paymentMethod.card?.expiryYear?.let { year ->
      it.putInt("expYear", year)
    }
    paymentMethod.card?.expiryMonth?.let { month ->
      it.putInt("expMonth", month)
    }
    it.putString("funding", paymentMethod.card?.funding)
    it.putString("last4", paymentMethod.card?.last4)
    it.putString("fingerprint", paymentMethod.card?.fingerprint)
    it.putString("preferredNetwork", paymentMethod.card?.networks?.preferred)
    it.putArray("availableNetworks", paymentMethod.card?.networks?.available?.toList() as? ReadableArray)
  })
  pm.putMap("SepaDebit", WritableNativeMap().also {
    it.putString("bankCode", paymentMethod.sepaDebit?.bankCode)
    it.putString("country", paymentMethod.sepaDebit?.country)
    it.putString("fingerprint", paymentMethod.sepaDebit?.fingerprint)
    it.putString("last4", paymentMethod.sepaDebit?.branchCode)
  })
  pm.putMap("BacsDebit", WritableNativeMap().also {
    it.putString("fingerprint", paymentMethod.bacsDebit?.fingerprint)
    it.putString("last4", paymentMethod.bacsDebit?.last4)
    it.putString("sortCode", paymentMethod.bacsDebit?.sortCode)
  })
  pm.putMap("AuBecsDebit",
    WritableNativeMap().also {
      it.putString("bsbNumber", paymentMethod.bacsDebit?.sortCode)
      it.putString("fingerprint", paymentMethod.bacsDebit?.fingerprint)
      it.putString("last4", paymentMethod.bacsDebit?.last4)
    })
  pm.putMap("Sofort", WritableNativeMap().also {
    it.putString("country", paymentMethod.sofort?.country)
  })
  pm.putMap("Ideal", WritableNativeMap().also {
    it.putString("bankName", paymentMethod.ideal?.bank)
    it.putString("bankIdentifierCode", paymentMethod.ideal?.bankIdentifierCode)
  })
  pm.putMap("Fpx", WritableNativeMap().also {
    it.putString("accountHolderType", paymentMethod.fpx?.accountHolderType)
    it.putString("bank", paymentMethod.fpx?.bank)
  })
  pm.putMap("Upi", WritableNativeMap().also {
    it.putString("vpa", paymentMethod.upi?.vpa)
  })
  pm.putMap("USBankAccount", WritableNativeMap().also {
    it.putString("routingNumber", paymentMethod.usBankAccount?.routingNumber)
    it.putString("accountType", mapFromUSBankAccountType(paymentMethod.usBankAccount?.accountType))
    it.putString("accountHolderType", mapFromUSBankAccountHolderType(paymentMethod.usBankAccount?.accountHolderType))
    it.putString("last4", paymentMethod.usBankAccount?.last4)
    it.putString("bankName", paymentMethod.usBankAccount?.bankName)
    it.putString("linkedAccount", paymentMethod.usBankAccount?.linkedAccount)
    it.putString("fingerprint", paymentMethod.usBankAccount?.fingerprint)
    it.putString("preferredNetworks", paymentMethod.usBankAccount?.networks?.preferred)
    it.putArray("supportedNetworks", paymentMethod.usBankAccount?.networks?.supported as? ReadableArray)
  })

  return pm
}

internal fun mapFromPaymentIntentResult(paymentIntent: PaymentIntent): WritableMap {
  val map: WritableMap = WritableNativeMap()
  map.putString("id", paymentIntent.id)
  map.putString("clientSecret", paymentIntent.clientSecret)
  map.putBoolean("livemode", paymentIntent.isLiveMode)
  map.putString("paymentMethodId", paymentIntent.paymentMethodId)
  map.putMap("paymentMethod", paymentIntent.paymentMethod?.let {
    mapFromPaymentMethod(it)
  } ?: run {
    null
  })
  map.putString("receiptEmail", paymentIntent.receiptEmail)
  map.putString("currency", paymentIntent.currency)
  map.putString("status", mapIntentStatus(paymentIntent.status))
  map.putString("description", paymentIntent.description)
  map.putString("receiptEmail", paymentIntent.receiptEmail)
  map.putString("created", convertToUnixTimestamp(paymentIntent.created))
  map.putString("captureMethod", mapCaptureMethod(paymentIntent.captureMethod))
  map.putString("confirmationMethod", mapConfirmationMethod(paymentIntent.confirmationMethod))
  map.putMap("nextAction", mapNextAction(paymentIntent.nextActionType, paymentIntent.nextActionData))
  map.putNull("lastPaymentError")
  map.putNull("shipping")
  map.putNull("amount")
  map.putNull("canceledAt")

  paymentIntent.lastPaymentError?.let {
    val paymentError: WritableMap = WritableNativeMap()
    paymentError.putString("code", it.code)
    paymentError.putString("message", it.message)
    paymentError.putString("type", mapFromPaymentIntentLastErrorType(it.type))
    paymentError.putString("declineCode", it.declineCode)
    paymentIntent.lastPaymentError?.paymentMethod?.let { paymentMethod ->
      paymentError.putMap("paymentMethod", mapFromPaymentMethod(paymentMethod))
    }

    map.putMap("lastPaymentError", paymentError)
  }

  paymentIntent.shipping?.let {
    map.putMap("shipping", mapIntentShipping(it))
  }

  paymentIntent.amount?.let {
    map.putDouble("amount", it.toDouble())
  }
  map.putString("canceledAt", convertToUnixTimestamp(paymentIntent.canceledAt))
  return map
}

internal fun mapFromMicrodepositType(type: MicrodepositType): String {
  return when (type) {
    MicrodepositType.AMOUNTS -> "amounts"
    MicrodepositType.DESCRIPTOR_CODE -> "descriptorCode"
    else -> "unknown"
  }
}

internal fun mapNextAction(type: NextActionType?, data: NextActionData?): WritableNativeMap? {
  val nextActionMap = WritableNativeMap()
  when (type) {
    NextActionType.RedirectToUrl -> {
      (data as? NextActionData.RedirectToUrl)?.let {
        nextActionMap.putString("type", "urlRedirect")
        nextActionMap.putString("redirectUrl", it.url.toString())
      }
    }
    NextActionType.VerifyWithMicrodeposits -> {
      (data as? NextActionData.VerifyWithMicrodeposits)?.let {
        nextActionMap.putString("type", "verifyWithMicrodeposits")
        nextActionMap.putString("arrivalDate", it.arrivalDate.toString())
        nextActionMap.putString("redirectUrl", it.hostedVerificationUrl)
        nextActionMap.putString("microdepositType", mapFromMicrodepositType(it.microdepositType))
      }
    }
    NextActionType.DisplayOxxoDetails -> {
      (data as? NextActionData.DisplayOxxoDetails)?.let {
        nextActionMap.putString("type", "oxxoVoucher")
        nextActionMap.putInt("expiration", it.expiresAfter)
        nextActionMap.putString("voucherURL", it.hostedVoucherUrl)
        nextActionMap.putString("voucherNumber", it.number)
      }
    }
    NextActionType.WeChatPayRedirect -> {
      (data as? NextActionData.WeChatPayRedirect)?.let {
        nextActionMap.putString("type", "weChatRedirect")
        nextActionMap.putString("redirectUrl", it.weChat.qrCodeUrl)
      }
    }
    NextActionType.AlipayRedirect -> { // TODO: Can't access, private
      return null
    }
    NextActionType.CashAppRedirect, NextActionType.BlikAuthorize, NextActionType.UseStripeSdk, NextActionType.UpiAwaitNotification,  null -> {
      return null
    }
  }
  return nextActionMap
}

internal fun mapFromPaymentIntentLastErrorType(errorType: PaymentIntent.Error.Type?): String? {
  return when (errorType) {
    PaymentIntent.Error.Type.ApiConnectionError -> "api_connection_error"
    PaymentIntent.Error.Type.AuthenticationError -> "authentication_error"
    PaymentIntent.Error.Type.ApiError -> "api_error"
    PaymentIntent.Error.Type.CardError -> "card_error"
    PaymentIntent.Error.Type.IdempotencyError -> "idempotency_error"
    PaymentIntent.Error.Type.InvalidRequestError -> "invalid_request_error"
    PaymentIntent.Error.Type.RateLimitError -> "rate_limit_error"
    else -> null
  }
}

internal fun mapFromSetupIntentLastErrorType(errorType: SetupIntent.Error.Type?): String? {
  return when (errorType) {
    SetupIntent.Error.Type.ApiConnectionError -> "api_connection_error"
    SetupIntent.Error.Type.AuthenticationError -> "authentication_error"
    SetupIntent.Error.Type.ApiError -> "api_error"
    SetupIntent.Error.Type.CardError -> "card_error"
    SetupIntent.Error.Type.IdempotencyError -> "idempotency_error"
    SetupIntent.Error.Type.InvalidRequestError -> "invalid_request_error"
    SetupIntent.Error.Type.RateLimitError -> "rate_limit_error"
    else -> null
  }
}

fun getValOr(map: ReadableMap?, key: String, default: String? = ""): String? {
  return map?.let {
    if (it.hasKey(key)) it.getString(key) else default
  } ?: default
}

internal fun mapToAddress(addressMap: ReadableMap?, cardAddress: Address?): Address {
  val address = Address.Builder()

  addressMap?.let {
    address
      .setPostalCode(getValOr(it, "postalCode"))
      .setCity(getValOr(it, "city"))
      .setCountry(getValOr(it, "country"))
      .setLine1(getValOr(it, "line1"))
      .setLine2(getValOr(it, "line2"))
      .setState(getValOr(it, "state"))
  }

  cardAddress?.let {
    if (!it.postalCode.isNullOrEmpty()) {
      address.setPostalCode(it.postalCode)
    }
    if (!it.country.isNullOrEmpty()) {
      address.setCountry(it.country)
    }
  }

  return address.build()
}

internal fun mapToBillingDetails(billingDetails: ReadableMap?, cardAddress: Address?): PaymentMethod.BillingDetails? {
  if (billingDetails == null && cardAddress == null) {
    return null
  }
  val address = mapToAddress(getMapOrNull(billingDetails, "address"), cardAddress)
  val paymentMethodBillingDetailsBuilder =  PaymentMethod.BillingDetails.Builder()

  if (billingDetails != null) {
    paymentMethodBillingDetailsBuilder
      .setName(getValOr(billingDetails, "name"))
      .setPhone(getValOr(billingDetails, "phone"))
      .setEmail(getValOr(billingDetails, "email"))
  }

  paymentMethodBillingDetailsBuilder.setAddress(address)
  return paymentMethodBillingDetailsBuilder.build()
}

internal fun mapToShippingDetails(shippingDetails: ReadableMap?): ConfirmPaymentIntentParams.Shipping? {
  if (shippingDetails == null) {
    return null
  }

  val address = mapToAddress(getMapOrNull(shippingDetails, "address"), null)

  return ConfirmPaymentIntentParams.Shipping(
    name = getValOr(shippingDetails, "name") ?: "",
    address = address
  )
}

private fun getStringOrNull(map: ReadableMap?, key: String): String? {
  return if (map?.hasKey(key) == true) map.getString(key) else null
}

fun getIntOrNull(map: ReadableMap?, key: String): Int? {
  return if (map?.hasKey(key) == true) map.getInt(key) else null
}

fun getMapOrNull(map: ReadableMap?, key: String): ReadableMap? {
  return if (map?.hasKey(key) == true) map.getMap(key) else null
}

fun getBooleanOrFalse(map: ReadableMap?, key: String): Boolean {
  return if (map?.hasKey(key) == true) map.getBoolean(key) else false
}

private fun convertToUnixTimestamp(timestamp: Long): String {
  return (timestamp * 1000).toString()
}

fun mapToUICustomization(params: ReadableMap): PaymentAuthConfig.Stripe3ds2UiCustomization {
  val labelCustomization = getMapOrNull(params, "label")
  val navigationBarCustomization = params.getMap("navigationBar")
  val textBoxCustomization = getMapOrNull(params, "textField")
  val submitButtonCustomization = getMapOrNull(params, "submitButton")
  val cancelButtonCustomization = getMapOrNull(params, "cancelButton")
  val nextButtonCustomization = getMapOrNull(params, "nextButton")
  val continueButtonCustomization = getMapOrNull(params, "continueButton")
  val resendButtonCustomization = getMapOrNull(params, "resendButton")

  val labelCustomizationBuilder = PaymentAuthConfig.Stripe3ds2LabelCustomization.Builder()
  val toolbarCustomizationBuilder = PaymentAuthConfig.Stripe3ds2ToolbarCustomization.Builder()
  val textBoxCustomizationBuilder = PaymentAuthConfig.Stripe3ds2TextBoxCustomization.Builder()

  val submitButtonCustomizationBuilder = PaymentAuthConfig.Stripe3ds2ButtonCustomization.Builder()
  val cancelButtonCustomizationBuilder = PaymentAuthConfig.Stripe3ds2ButtonCustomization.Builder()
  val nextButtonCustomizationBuilder = PaymentAuthConfig.Stripe3ds2ButtonCustomization.Builder()
  val continueButtonCustomizationBuilder = PaymentAuthConfig.Stripe3ds2ButtonCustomization.Builder()
  val resendButtonCustomizationBuilder = PaymentAuthConfig.Stripe3ds2ButtonCustomization.Builder()

  getStringOrNull(labelCustomization,"headingTextColor")?.let {
    labelCustomizationBuilder.setHeadingTextColor(it)
  }
  getStringOrNull(labelCustomization,"textColor")?.let {
    labelCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(labelCustomization,"headingFontSize")?.let {
    labelCustomizationBuilder.setHeadingTextFontSize(it)
  }
  getIntOrNull(labelCustomization,"textFontSize")?.let {
    labelCustomizationBuilder.setTextFontSize(it)
  }

  getStringOrNull(navigationBarCustomization,"headerText")?.let {
    toolbarCustomizationBuilder.setHeaderText(it)
  }
  getStringOrNull(navigationBarCustomization,"buttonText")?.let {
    toolbarCustomizationBuilder.setButtonText(it)
  }
  getStringOrNull(navigationBarCustomization,"textColor")?.let {
    toolbarCustomizationBuilder.setTextColor(it)
  }
  getStringOrNull(navigationBarCustomization,"statusBarColor")?.let {
    toolbarCustomizationBuilder.setStatusBarColor(it)
  }
  getStringOrNull(navigationBarCustomization,"backgroundColor")?.let {
    toolbarCustomizationBuilder.setBackgroundColor(it)
  }
  getIntOrNull(navigationBarCustomization,"textFontSize")?.let {
    toolbarCustomizationBuilder.setTextFontSize(it)
  }

  getStringOrNull(textBoxCustomization, "borderColor")?.let {
    textBoxCustomizationBuilder.setBorderColor(it)
  }
  getStringOrNull(textBoxCustomization, "textColor")?.let {
    textBoxCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(textBoxCustomization, "borderWidth")?.let {
    textBoxCustomizationBuilder.setBorderWidth(it)
  }
  getIntOrNull(textBoxCustomization, "borderRadius")?.let {
    textBoxCustomizationBuilder.setCornerRadius(it)
  }
  getIntOrNull(textBoxCustomization, "textFontSize")?.let {
    textBoxCustomizationBuilder.setTextFontSize(it)
  }

  // Submit button
  getStringOrNull(submitButtonCustomization, "backgroundColor")?.let {
    submitButtonCustomizationBuilder.setBackgroundColor(it)
  }
  getIntOrNull(submitButtonCustomization, "borderRadius")?.let {
    submitButtonCustomizationBuilder.setCornerRadius(it)
  }
  getStringOrNull(submitButtonCustomization, "textColor")?.let {
    submitButtonCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(submitButtonCustomization, "textFontSize")?.let {
    submitButtonCustomizationBuilder.setTextFontSize(it)
  }

  // Cancel button
  getStringOrNull(cancelButtonCustomization, "backgroundColor")?.let {
    cancelButtonCustomizationBuilder.setBackgroundColor(it)
  }
  getIntOrNull(cancelButtonCustomization, "borderRadius")?.let {
    cancelButtonCustomizationBuilder.setCornerRadius(it)
  }
  getStringOrNull(cancelButtonCustomization, "textColor")?.let {
    cancelButtonCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(cancelButtonCustomization, "textFontSize")?.let {
    cancelButtonCustomizationBuilder.setTextFontSize(it)
  }

  // Continue button
  getStringOrNull(continueButtonCustomization, "backgroundColor")?.let {
    continueButtonCustomizationBuilder.setBackgroundColor(it)
  }
  getIntOrNull(continueButtonCustomization, "borderRadius")?.let {
    continueButtonCustomizationBuilder.setCornerRadius(it)
  }
  getStringOrNull(continueButtonCustomization, "textColor")?.let {
    continueButtonCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(continueButtonCustomization, "textFontSize")?.let {
    continueButtonCustomizationBuilder.setTextFontSize(it)
  }

  // Next button
  getStringOrNull(nextButtonCustomization, "backgroundColor")?.let {
    nextButtonCustomizationBuilder.setBackgroundColor(it)
  }
  getIntOrNull(nextButtonCustomization, "borderRadius")?.let {
    nextButtonCustomizationBuilder.setCornerRadius(it)
  }
  getStringOrNull(nextButtonCustomization, "textColor")?.let {
    nextButtonCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(nextButtonCustomization, "textFontSize")?.let {
    nextButtonCustomizationBuilder.setTextFontSize(it)
  }

  // Resend button
  getStringOrNull(resendButtonCustomization, "backgroundColor")?.let {
    resendButtonCustomizationBuilder.setBackgroundColor(it)
  }
  getIntOrNull(resendButtonCustomization, "borderRadius")?.let {
    resendButtonCustomizationBuilder.setCornerRadius(it)
  }
  getStringOrNull(resendButtonCustomization, "textColor")?.let {
    resendButtonCustomizationBuilder.setTextColor(it)
  }
  getIntOrNull(resendButtonCustomization, "textFontSize")?.let {
    resendButtonCustomizationBuilder.setTextFontSize(it)
  }



  val uiCustomization = PaymentAuthConfig.Stripe3ds2UiCustomization.Builder()
    .setLabelCustomization(
      labelCustomizationBuilder.build()
    )
    .setToolbarCustomization(
      toolbarCustomizationBuilder.build()
    )
    .setButtonCustomization(
      submitButtonCustomizationBuilder.build(),
      PaymentAuthConfig.Stripe3ds2UiCustomization.ButtonType.SUBMIT
    )
    .setButtonCustomization(
      continueButtonCustomizationBuilder.build(),
      PaymentAuthConfig.Stripe3ds2UiCustomization.ButtonType.CONTINUE
    )
    .setButtonCustomization(
      nextButtonCustomizationBuilder.build(),
      PaymentAuthConfig.Stripe3ds2UiCustomization.ButtonType.SELECT
    )
    .setButtonCustomization(
      cancelButtonCustomizationBuilder.build(),
      PaymentAuthConfig.Stripe3ds2UiCustomization.ButtonType.CANCEL
    )
    .setButtonCustomization(
      resendButtonCustomizationBuilder.build(),
      PaymentAuthConfig.Stripe3ds2UiCustomization.ButtonType.RESEND
    )

  getStringOrNull(params, "accentColor")?.let {
    uiCustomization.setAccentColor(it)
  }

  return uiCustomization.build()
}

internal fun mapFromSetupIntentResult(setupIntent: SetupIntent): WritableMap {
  val map: WritableMap = WritableNativeMap()
  val paymentMethodTypes: WritableArray = Arguments.createArray()
  map.putString("id", setupIntent.id)
  map.putString("status", mapIntentStatus(setupIntent.status))
  map.putString("description", setupIntent.description)
  map.putBoolean("livemode", setupIntent.isLiveMode)
  map.putString("clientSecret", setupIntent.clientSecret)
  map.putString("paymentMethodId", setupIntent.paymentMethodId)
  map.putMap("paymentMethod", setupIntent.paymentMethod?.let {
    mapFromPaymentMethod(it)
  } ?: run {
    null
  })
  map.putString("usage", mapSetupIntentUsage(setupIntent.usage))
  map.putString("created", convertToUnixTimestamp(setupIntent.created))
  map.putMap("nextAction", mapNextAction(setupIntent.nextActionType, setupIntent.nextActionData))

  setupIntent.lastSetupError?.let {
    val setupError: WritableMap = WritableNativeMap()
    setupError.putString("code", it.code)
    setupError.putString("message", it.message)
    setupError.putString("type", mapFromSetupIntentLastErrorType(it.type))
    setupError.putString("declineCode", it.declineCode)
    setupIntent.lastSetupError?.paymentMethod?.let { paymentMethod ->
      setupError.putMap("paymentMethod", mapFromPaymentMethod(paymentMethod))
    }
    map.putMap("lastSetupError", setupError)
  }

  setupIntent.paymentMethodTypes.forEach { code ->
    val type: PaymentMethod.Type? = PaymentMethod.Type.values().find {
      code == it.code
    }
    type?.let {
      paymentMethodTypes.pushString(mapPaymentMethodType(it))
    }
  }

  map.putArray("paymentMethodTypes", paymentMethodTypes)

  return map
}

internal fun mapSetupIntentUsage(type: StripeIntent.Usage?): String {
  return when (type) {
    StripeIntent.Usage.OffSession -> "OffSession"
    StripeIntent.Usage.OnSession -> "OnSession"
    StripeIntent.Usage.OneTime -> "OneTime"
    else -> "Unknown"
  }
}

fun mapToPaymentIntentFutureUsage(type: String?): ConfirmPaymentIntentParams.SetupFutureUsage? {
  return when (type) {
    "OffSession" ->  ConfirmPaymentIntentParams.SetupFutureUsage.OffSession
    "OnSession" ->  ConfirmPaymentIntentParams.SetupFutureUsage.OnSession
    else ->  null
  }
}

fun toBundleObject(readableMap: ReadableMap?): Bundle {
  val result = Bundle()
  if (readableMap == null) {
    return result
  }
  val iterator = readableMap.keySetIterator()
  while (iterator.hasNextKey()) {
    val key = iterator.nextKey()
    when (readableMap.getType(key)) {
      ReadableType.Null -> result.putString(key, null)
      ReadableType.Boolean -> result.putBoolean(key, readableMap.getBoolean(key))
      ReadableType.Number -> try {
        result.putInt(key, readableMap.getInt(key))
      } catch (e: Exception) {
        result.putDouble(key, readableMap.getDouble(key))
      }
      ReadableType.String -> result.putString(key, readableMap.getString(key))
      ReadableType.Map -> result.putBundle(key, toBundleObject(readableMap.getMap(key)))
      ReadableType.Array -> Log.e("toBundleException", "Cannot put arrays of objects into bundles. Failed on: $key.")
      else -> Log.e("toBundleException", "Could not convert object with key: $key.")
    }
  }
  return result
}
