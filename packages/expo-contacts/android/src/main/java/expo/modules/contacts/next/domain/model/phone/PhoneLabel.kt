package expo.modules.contacts.next.domain.model.phone

import android.provider.ContactsContract.CommonDataKinds.Phone

sealed class PhoneLabel {
  abstract val type: Int
  abstract val label: String?

  object Home : PhoneLabel() {
    override val type = Phone.TYPE_HOME
    override val label = "home"
  }

  object Mobile : PhoneLabel() {
    override val type = Phone.TYPE_MOBILE
    override val label = "mobile"
  }

  object Work : PhoneLabel() {
    override val type = Phone.TYPE_WORK
    override val label = "work"
  }

  object FaxWork : PhoneLabel() {
    override val type = Phone.TYPE_FAX_WORK
    override val label = "faxWork"
  }

  object FaxHome : PhoneLabel() {
    override val type = Phone.TYPE_FAX_HOME
    override val label = "faxHome"
  }

  object Pager : PhoneLabel() {
    override val type = Phone.TYPE_PAGER
    override val label = "pager"
  }

  object Other : PhoneLabel() {
    override val type = Phone.TYPE_OTHER
    override val label = "other"
  }

  object Callback : PhoneLabel() {
    override val type = Phone.TYPE_CALLBACK
    override val label = "callback"
  }

  object Car : PhoneLabel() {
    override val type = Phone.TYPE_CAR
    override val label = "car"
  }

  object CompanyMain : PhoneLabel() {
    override val type = Phone.TYPE_COMPANY_MAIN
    override val label = "companyMain"
  }

  object Isdn : PhoneLabel() {
    override val type = Phone.TYPE_ISDN
    override val label = "isdn"
  }

  object Main : PhoneLabel() {
    override val type = Phone.TYPE_MAIN
    override val label = "main"
  }

  object OtherFax : PhoneLabel() {
    override val type = Phone.TYPE_OTHER_FAX
    override val label = "otherFax"
  }

  object Radio : PhoneLabel() {
    override val type = Phone.TYPE_RADIO
    override val label = "radio"
  }

  object Telex : PhoneLabel() {
    override val type = Phone.TYPE_TELEX
    override val label = "telex"
  }

  object TtyTdd : PhoneLabel() {
    override val type = Phone.TYPE_TTY_TDD
    override val label = "ttyTdd"
  }

  object WorkMobile : PhoneLabel() {
    override val type = Phone.TYPE_WORK_MOBILE
    override val label = "workMobile"
  }

  object WorkPager : PhoneLabel() {
    override val type = Phone.TYPE_WORK_PAGER
    override val label = "workPager"
  }

  object Assistant : PhoneLabel() {
    override val type = Phone.TYPE_ASSISTANT
    override val label = "assistant"
  }

  object Mms : PhoneLabel() {
    override val type = Phone.TYPE_MMS
    override val label = "mms"
  }

  data class Custom(override val label: String) : PhoneLabel() {
    override val type = Phone.TYPE_CUSTOM
  }

  object Unknown : PhoneLabel() {
    override val type = Phone.TYPE_CUSTOM
    override val label = "unknown"
  }
}
