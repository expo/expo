package expo.modules.contacts.next.domain.model.phone

import android.provider.ContactsContract.CommonDataKinds.Phone

sealed class PhoneLabel {
  abstract val type: Int
  open val label: String? = null

  object Home : PhoneLabel() {
    override val type = Phone.TYPE_HOME
  }

  object Mobile : PhoneLabel() {
    override val type = Phone.TYPE_MOBILE
  }

  object Work : PhoneLabel() {
    override val type = Phone.TYPE_WORK
  }

  object FaxWork : PhoneLabel() {
    override val type = Phone.TYPE_FAX_WORK
  }

  object FaxHome : PhoneLabel() {
    override val type = Phone.TYPE_FAX_HOME
  }

  object Pager : PhoneLabel() {
    override val type = Phone.TYPE_PAGER
  }

  object Other : PhoneLabel() {
    override val type = Phone.TYPE_OTHER
  }

  object Callback : PhoneLabel() {
    override val type = Phone.TYPE_CALLBACK
  }

  object Car : PhoneLabel() {
    override val type = Phone.TYPE_CAR
  }

  object CompanyMain : PhoneLabel() {
    override val type = Phone.TYPE_COMPANY_MAIN
  }

  object Isdn : PhoneLabel() {
    override val type = Phone.TYPE_ISDN
  }

  object Main : PhoneLabel() {
    override val type = Phone.TYPE_MAIN
  }

  object OtherFax : PhoneLabel() {
    override val type = Phone.TYPE_OTHER_FAX
  }

  object Radio : PhoneLabel() {
    override val type = Phone.TYPE_RADIO
  }

  object Telex : PhoneLabel() {
    override val type = Phone.TYPE_TELEX
  }

  object TtyTdd : PhoneLabel() {
    override val type = Phone.TYPE_TTY_TDD
  }

  object WorkMobile : PhoneLabel() {
    override val type = Phone.TYPE_WORK_MOBILE
  }

  object WorkPager : PhoneLabel() {
    override val type = Phone.TYPE_WORK_PAGER
  }

  object Assistant : PhoneLabel() {
    override val type = Phone.TYPE_ASSISTANT
  }

  object Mms : PhoneLabel() {
    override val type = Phone.TYPE_MMS
  }

  data class Custom(override val label: String) : PhoneLabel() {
    override val type = Phone.TYPE_CUSTOM
  }
}
