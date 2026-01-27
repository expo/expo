package expo.modules.contacts.next.mappers.domain.data.list.label

import expo.modules.contacts.next.domain.model.phone.PhoneLabel
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.kotlin.types.map

object PhoneLabelMapper {
  fun toDomain(label: String?): PhoneLabel {
    if (label.isNullOrBlank()) {
      return PhoneLabel.Custom("other")
    }

    return when (label.lowercase()) {
      "home" -> PhoneLabel.Home
      "mobile" -> PhoneLabel.Mobile
      "work" -> PhoneLabel.Work
      "faxwork" -> PhoneLabel.FaxWork
      "faxhome" -> PhoneLabel.FaxHome
      "pager" -> PhoneLabel.Pager
      "other" -> PhoneLabel.Other
      "callback" -> PhoneLabel.Callback
      "car" -> PhoneLabel.Car
      "companymain" -> PhoneLabel.CompanyMain
      "isdn" -> PhoneLabel.Isdn
      "main" -> PhoneLabel.Main
      "otherfax" -> PhoneLabel.OtherFax
      "radio" -> PhoneLabel.Radio
      "telex" -> PhoneLabel.Telex
      "ttyTdd" -> PhoneLabel.TtyTdd
      "workmobile" -> PhoneLabel.WorkMobile
      "workpager" -> PhoneLabel.WorkPager
      "assistant" -> PhoneLabel.Assistant
      "mms" -> PhoneLabel.Mms
      else -> PhoneLabel.Custom(label)
    }
  }

  fun toDomain(label: ValueOrUndefined<String?>): ValueOrUndefined<PhoneLabel> {
    return label.map { toDomain(it) }
  }

  fun toRecord(label: PhoneLabel): String? {
    return when (label) {
      is PhoneLabel.Home -> "home"
      is PhoneLabel.Mobile -> "mobile"
      is PhoneLabel.Work -> "work"
      is PhoneLabel.FaxWork -> "faxWork"
      is PhoneLabel.FaxHome -> "faxHome"
      is PhoneLabel.Pager -> "pager"
      is PhoneLabel.Other -> "other"
      is PhoneLabel.Callback -> "callback"
      is PhoneLabel.Car -> "car"
      is PhoneLabel.CompanyMain -> "companyMain"
      is PhoneLabel.Isdn -> "isdn"
      is PhoneLabel.Main -> "main"
      is PhoneLabel.OtherFax -> "otherFax"
      is PhoneLabel.Radio -> "radio"
      is PhoneLabel.Telex -> "telex"
      is PhoneLabel.TtyTdd -> "ttyTdd"
      is PhoneLabel.WorkMobile -> "workMobile"
      is PhoneLabel.WorkPager -> "workPager"
      is PhoneLabel.Assistant -> "assistant"
      is PhoneLabel.Mms -> "mms"
      is PhoneLabel.Custom -> label.label
    }
  }
}
