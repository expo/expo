package expo.modules.ui

import androidx.compose.ui.autofill.ContentType
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
internal data class SemanticsParams(
  @Field val contentType: String? = null
) : Record

internal fun String?.toContentType(): ContentType? = when (this) {
  "email" -> ContentType.EmailAddress
  "username" -> ContentType.Username
  "username-new" -> ContentType.NewUsername
  "password", "current-password" -> ContentType.Password
  "new-password", "password-new" -> ContentType.NewPassword
  "one-time-code", "sms-otp" -> ContentType.SmsOtpCode
  "tel" -> ContentType.PhoneNumber
  "tel-country-code" -> ContentType.PhoneCountryCode
  "tel-national" -> ContentType.PhoneNumberNational
  "tel-device" -> ContentType.PhoneNumberDevice
  "name" -> ContentType.PersonFullName
  "given-name", "name-given" -> ContentType.PersonFirstName
  "family-name", "name-family" -> ContentType.PersonLastName
  "additional-name", "name-middle" -> ContentType.PersonMiddleName
  "name-middle-initial" -> ContentType.PersonMiddleInitial
  "honorific-prefix", "name-prefix" -> ContentType.PersonNamePrefix
  "honorific-suffix", "name-suffix" -> ContentType.PersonNameSuffix
  "street-address", "address-line1" -> ContentType.AddressStreet
  "address-line2" -> ContentType.AddressAuxiliaryDetails
  "postal-address-locality" -> ContentType.AddressLocality
  "postal-address-region" -> ContentType.AddressRegion
  "postal-address-extended-postal-code" -> ContentType.PostalCodeExtended
  "postal-code" -> ContentType.PostalCode
  "country", "postal-address-country" -> ContentType.AddressCountry
  "cc-number" -> ContentType.CreditCardNumber
  "cc-csc" -> ContentType.CreditCardSecurityCode
  "cc-exp" -> ContentType.CreditCardExpirationDate
  "cc-exp-month" -> ContentType.CreditCardExpirationMonth
  "cc-exp-year" -> ContentType.CreditCardExpirationYear
  "cc-exp-day" -> ContentType.CreditCardExpirationDay
  "birthdate-full" -> ContentType.BirthDateFull
  "birthdate-day" -> ContentType.BirthDateDay
  "birthdate-month" -> ContentType.BirthDateMonth
  "birthdate-year" -> ContentType.BirthDateYear
  "gender" -> ContentType.Gender
  else -> null
}
