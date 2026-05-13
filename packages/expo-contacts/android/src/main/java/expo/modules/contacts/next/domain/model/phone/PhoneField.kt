package expo.modules.contacts.next.domain.model.phone

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Phone
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.wrappers.DataId

object PhoneField : ExtractableField.Data<ExistingPhone> {
  override val mimeType = Phone.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    Phone.NUMBER,
    Phone.TYPE,
    Phone.LABEL
  )

  override fun extract(cursor: Cursor): ExistingPhone = with(cursor) {
    return ExistingPhone(
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      number = getString(getColumnIndexOrThrow(Phone.NUMBER)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel(): PhoneLabel =
    when (getInt(getColumnIndexOrThrow(Phone.TYPE))) {
      Phone.TYPE_HOME -> PhoneLabel.Home
      Phone.TYPE_MOBILE -> PhoneLabel.Mobile
      Phone.TYPE_WORK -> PhoneLabel.Work
      Phone.TYPE_FAX_WORK -> PhoneLabel.FaxWork
      Phone.TYPE_FAX_HOME -> PhoneLabel.FaxHome
      Phone.TYPE_PAGER -> PhoneLabel.Pager
      Phone.TYPE_OTHER -> PhoneLabel.Other
      Phone.TYPE_CALLBACK -> PhoneLabel.Callback
      Phone.TYPE_CAR -> PhoneLabel.Car
      Phone.TYPE_COMPANY_MAIN -> PhoneLabel.CompanyMain
      Phone.TYPE_ISDN -> PhoneLabel.Isdn
      Phone.TYPE_MAIN -> PhoneLabel.Main
      Phone.TYPE_OTHER_FAX -> PhoneLabel.OtherFax
      Phone.TYPE_RADIO -> PhoneLabel.Radio
      Phone.TYPE_TELEX -> PhoneLabel.Telex
      Phone.TYPE_TTY_TDD -> PhoneLabel.TtyTdd
      Phone.TYPE_WORK_MOBILE -> PhoneLabel.WorkMobile
      Phone.TYPE_WORK_PAGER -> PhoneLabel.WorkPager
      Phone.TYPE_ASSISTANT -> PhoneLabel.Assistant
      Phone.TYPE_MMS -> PhoneLabel.Mms
      else -> {
        val customLabel = getString(getColumnIndexOrThrow(Phone.LABEL))
        PhoneLabel.Custom(customLabel)
      }
    }
}
