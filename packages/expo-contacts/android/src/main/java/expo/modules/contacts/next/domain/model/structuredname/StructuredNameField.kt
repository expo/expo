package expo.modules.contacts.next.domain.model.structuredname

import android.database.Cursor
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.StructuredName
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.structuredname.operations.ExistingStructuredName
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object StructuredNameField : ExtractableField.Data<ExistingStructuredName> {
  override val mimeType = StructuredName.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    StructuredName.DISPLAY_NAME,
    StructuredName.GIVEN_NAME,
    StructuredName.FAMILY_NAME,
    StructuredName.MIDDLE_NAME,
    StructuredName.PREFIX,
    StructuredName.SUFFIX,
    StructuredName.PHONETIC_GIVEN_NAME,
    StructuredName.PHONETIC_MIDDLE_NAME,
    StructuredName.PHONETIC_FAMILY_NAME,
    ContactsContract.Data.IS_SUPER_PRIMARY
  )

  override fun extract(cursor: Cursor): ExistingStructuredName = with(cursor) {
    return ExistingStructuredName(
      dataId = DataId(getRequiredString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      givenName = getNullableString(getColumnIndexOrThrow(StructuredName.GIVEN_NAME)),
      familyName = getNullableString(getColumnIndexOrThrow(StructuredName.FAMILY_NAME)),
      middleName = getNullableString(getColumnIndexOrThrow(StructuredName.MIDDLE_NAME)),
      prefix = getNullableString(getColumnIndexOrThrow(StructuredName.PREFIX)),
      suffix = getNullableString(getColumnIndexOrThrow(StructuredName.SUFFIX)),
      phoneticGivenName = getNullableString(getColumnIndexOrThrow(StructuredName.PHONETIC_GIVEN_NAME)),
      phoneticMiddleName = getNullableString(getColumnIndexOrThrow(StructuredName.PHONETIC_MIDDLE_NAME)),
      phoneticFamilyName = getNullableString(getColumnIndexOrThrow(StructuredName.PHONETIC_FAMILY_NAME))
    )
  }
}
