package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds

import expo.modules.contacts.EXColumns

class PhoneNumberModel : BaseModel() {
  override val contentType = CommonDataKinds.Phone.CONTENT_ITEM_TYPE

  override val dataAlias = "number"

  override fun fromMap(readableMap: Map<String, Any?>) {
    super.fromMap(readableMap)
    val phoneNumber = data!!
    map.putString("digits", phoneNumber.replace("[^\\d.]".toRegex(), ""))
  }

  override fun mapStringToType(label: String?) = when (label) {
    "home" -> CommonDataKinds.Phone.TYPE_HOME
    "mobile" -> CommonDataKinds.Phone.TYPE_MOBILE
    "work" -> CommonDataKinds.Phone.TYPE_WORK
    "faxWork" -> CommonDataKinds.Phone.TYPE_FAX_WORK
    "faxHome" -> CommonDataKinds.Phone.TYPE_FAX_HOME
    "pager" -> CommonDataKinds.Phone.TYPE_PAGER
    "callback" -> CommonDataKinds.Phone.TYPE_CALLBACK
    "car" -> CommonDataKinds.Phone.TYPE_CAR
    "companyMain" -> CommonDataKinds.Phone.TYPE_COMPANY_MAIN
    "isdn" -> CommonDataKinds.Phone.TYPE_ISDN
    "main" -> CommonDataKinds.Phone.TYPE_MAIN
    "otherFax" -> CommonDataKinds.Phone.TYPE_OTHER_FAX
    "radio" -> CommonDataKinds.Phone.TYPE_RADIO
    "telex" -> CommonDataKinds.Phone.TYPE_TELEX
    "ttyTdd" -> CommonDataKinds.Phone.TYPE_TTY_TDD
    "workMobile" -> CommonDataKinds.Phone.TYPE_WORK_MOBILE
    "workPager" -> CommonDataKinds.Phone.TYPE_WORK_PAGER
    "assistant" -> CommonDataKinds.Phone.TYPE_ASSISTANT
    "mms" -> CommonDataKinds.Phone.TYPE_MMS
    "other" -> CommonDataKinds.Phone.TYPE_OTHER
    else -> EXColumns.TYPE_CUSTOM
  }

  override fun getLabelFromCursor(cursor: Cursor) = super.getLabelFromCursor(cursor)
    ?: when (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
      CommonDataKinds.Phone.TYPE_HOME -> "home"
      CommonDataKinds.Phone.TYPE_WORK -> "work"
      CommonDataKinds.Phone.TYPE_MOBILE -> "mobile"
      CommonDataKinds.Phone.TYPE_OTHER -> "other"
      else -> "unknown"
    }
}
