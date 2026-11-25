package expo.modules.contacts.next.domain.model.structuredpostal

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.StructuredPostal
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableInt
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object StructuredPostalField : ExtractableField.Data<ExistingStructuredPostal> {
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
      dataId = DataId(getRequiredString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      street = getNullableString(getColumnIndexOrThrow(StructuredPostal.STREET)),
      city = getNullableString(getColumnIndexOrThrow(StructuredPostal.CITY)),
      region = getNullableString(getColumnIndexOrThrow(StructuredPostal.REGION)),
      postcode = getNullableString(getColumnIndexOrThrow(StructuredPostal.POSTCODE)),
      country = getNullableString(getColumnIndexOrThrow(StructuredPostal.COUNTRY)),
      label = extractLabel()
    )
  }

  private fun Cursor.extractLabel() =
    when (getNullableInt(StructuredPostal.TYPE)) {
      StructuredPostal.TYPE_HOME -> StructuredPostalLabel.Home
      StructuredPostal.TYPE_WORK -> StructuredPostalLabel.Work
      StructuredPostal.TYPE_OTHER -> StructuredPostalLabel.Other
      null -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(StructuredPostal.LABEL))
        StructuredPostalLabel.MalformedType(customLabel)
      }
      else -> {
        val customLabel = getNullableString(getColumnIndexOrThrow(StructuredPostal.LABEL))
        customLabel?.let { StructuredPostalLabel.Custom(it) } ?: StructuredPostalLabel.MalformedCustom
      }
    }
}
