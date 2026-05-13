package expo.modules.contacts.next.domain.model.email

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Email
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.wrappers.DataId

object EmailField : ExtractableField.Data<ExistingEmail> {
  override val mimeType = Email.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    Email.ADDRESS,
    Email.TYPE,
    Email.LABEL
  )

  override fun extract(cursor: Cursor): ExistingEmail = with(cursor) {
    return ExistingEmail(
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      address = getString(getColumnIndexOrThrow(Email.ADDRESS)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel(): EmailLabel =
    when (getInt(getColumnIndexOrThrow(Email.TYPE))) {
      Email.TYPE_HOME -> EmailLabel.Home
      Email.TYPE_WORK -> EmailLabel.Work
      Email.TYPE_OTHER -> EmailLabel.Other
      Email.TYPE_MOBILE -> EmailLabel.Mobile
      else -> {
        val customLabel = getString(getColumnIndexOrThrow(Email.LABEL))
        EmailLabel.Custom(customLabel ?: "")
      }
    }
}
