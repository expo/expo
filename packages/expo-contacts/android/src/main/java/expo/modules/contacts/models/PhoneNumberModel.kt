package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.Columns

class PhoneNumberModel : BaseModel() {
  override val contentType: String = CommonDataKinds.Phone.CONTENT_ITEM_TYPE
  override val dataAlias: String = "number"

  override fun fromMap(readableMap: Map<String, Any?>) {
    super.fromMap(readableMap)
    val phoneNumber = data!!
    map.putString("digits", phoneNumber.replace("[^\\d.]".toRegex(), ""))
  }

  override fun mapStringToType(label: String?): Int {
    val phoneType = when (label) {
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
      else -> Columns.TYPE_CUSTOM
    }
    return phoneType
  }

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        CommonDataKinds.Phone.TYPE_HOME -> "home"
        CommonDataKinds.Phone.TYPE_WORK -> "work"
        CommonDataKinds.Phone.TYPE_MOBILE -> "mobile"
        CommonDataKinds.Phone.TYPE_FAX_WORK -> "faxWork"
        CommonDataKinds.Phone.TYPE_FAX_HOME -> "faxHome"
        CommonDataKinds.Phone.TYPE_PAGER -> "pager"
        CommonDataKinds.Phone.TYPE_CALLBACK -> "callback"
        CommonDataKinds.Phone.TYPE_CAR -> "car"
        CommonDataKinds.Phone.TYPE_COMPANY_MAIN -> "companyMain"
        CommonDataKinds.Phone.TYPE_ISDN -> "isdn"
        CommonDataKinds.Phone.TYPE_MAIN -> "main"
        CommonDataKinds.Phone.TYPE_OTHER_FAX -> "otherFax"
        CommonDataKinds.Phone.TYPE_RADIO -> "radio"
        CommonDataKinds.Phone.TYPE_TELEX -> "telex"
        CommonDataKinds.Phone.TYPE_TTY_TDD -> "ttyTdd"
        CommonDataKinds.Phone.TYPE_WORK_MOBILE -> "workMobile"
        CommonDataKinds.Phone.TYPE_WORK_PAGER -> "workPager"
        CommonDataKinds.Phone.TYPE_ASSISTANT -> "assistant"
        CommonDataKinds.Phone.TYPE_MMS -> "mms"
        CommonDataKinds.Phone.TYPE_OTHER -> "other"
        else -> "unknown"
      }
  }
}
