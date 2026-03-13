package expo.modules.contacts.next.domain.model.phone

import android.provider.ContactsContract.CommonDataKinds.Phone

sealed class PhoneLabel(val type: Int, val label: String? = null) {
  object Home : PhoneLabel(Phone.TYPE_HOME)
  object Mobile : PhoneLabel(Phone.TYPE_MOBILE)
  object Work : PhoneLabel(Phone.TYPE_WORK)
  object FaxWork : PhoneLabel(Phone.TYPE_FAX_WORK)
  object FaxHome : PhoneLabel(Phone.TYPE_FAX_HOME)
  object Pager : PhoneLabel(Phone.TYPE_PAGER)
  object Other : PhoneLabel(Phone.TYPE_OTHER)
  object Callback : PhoneLabel(Phone.TYPE_CALLBACK)
  object Car : PhoneLabel(Phone.TYPE_CAR)
  object CompanyMain : PhoneLabel(Phone.TYPE_COMPANY_MAIN)
  object Isdn : PhoneLabel(Phone.TYPE_ISDN)
  object Main : PhoneLabel(Phone.TYPE_MAIN)
  object OtherFax : PhoneLabel(Phone.TYPE_OTHER_FAX)
  object Radio : PhoneLabel(Phone.TYPE_RADIO)
  object Telex : PhoneLabel(Phone.TYPE_TELEX)
  object TtyTdd : PhoneLabel(Phone.TYPE_TTY_TDD)
  object WorkMobile : PhoneLabel(Phone.TYPE_WORK_MOBILE)
  object WorkPager : PhoneLabel(Phone.TYPE_WORK_PAGER)
  object Assistant : PhoneLabel(Phone.TYPE_ASSISTANT)
  object Mms : PhoneLabel(Phone.TYPE_MMS)
  class Custom(label: String) : PhoneLabel(Phone.TYPE_CUSTOM, label)
}
