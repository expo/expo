package expo.modules.contacts.next.domain.model.structuredpostal

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.StructuredPostal
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.wrappers.DataId

object StructuredPostalField : ExtractableField.Data<ExistingStructuredPostal>, ClearableField {
  override val mimeType = StructuredPostal.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    StructuredPostal.STREET,
    StructuredPostal.CITY,
    StructuredPostal.REGION,
    StructuredPostal.POSTCODE,
    StructuredPostal.COUNTRY,
    StructuredPostal.TYPE,
    StructuredPostal.LABEL
  )

  override fun extract(cursor: Cursor): ExistingStructuredPostal = with(cursor) {
    return ExistingStructuredPostal(
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      street = getString(getColumnIndexOrThrow(StructuredPostal.STREET)),
      city = getString(getColumnIndexOrThrow(StructuredPostal.CITY)),
      region = getString(getColumnIndexOrThrow(StructuredPostal.REGION)),
      postcode = getString(getColumnIndexOrThrow(StructuredPostal.POSTCODE)),
      country = getString(getColumnIndexOrThrow(StructuredPostal.COUNTRY)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel() =
    when (getInt(getColumnIndexOrThrow(StructuredPostal.TYPE))) {
      StructuredPostal.TYPE_HOME -> StructuredPostalLabel.Home
      StructuredPostal.TYPE_WORK -> StructuredPostalLabel.Work
      StructuredPostal.TYPE_OTHER -> StructuredPostalLabel.Other
      StructuredPostal.TYPE_CUSTOM -> {
        val customLabel = getString(getColumnIndexOrThrow(StructuredPostal.LABEL))
        StructuredPostalLabel.Custom(customLabel)
      }
      else -> StructuredPostalLabel.Unknown
    }
}
