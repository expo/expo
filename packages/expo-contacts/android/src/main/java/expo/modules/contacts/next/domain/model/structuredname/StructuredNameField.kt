package expo.modules.contacts.next.domain.model.structuredname

import android.database.Cursor
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.StructuredName
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.structuredname.operations.ExistingStructuredName
import expo.modules.contacts.next.domain.wrappers.DataId

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
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      givenName = getString(getColumnIndexOrThrow(StructuredName.GIVEN_NAME)),
      familyName = getString(getColumnIndexOrThrow(StructuredName.FAMILY_NAME)),
      middleName = getString(getColumnIndexOrThrow(StructuredName.MIDDLE_NAME)),
      prefix = getString(getColumnIndexOrThrow(StructuredName.PREFIX)),
      suffix = getString(getColumnIndexOrThrow(StructuredName.SUFFIX)),
      phoneticGivenName = getString(getColumnIndexOrThrow(StructuredName.PHONETIC_GIVEN_NAME)),
      phoneticMiddleName = getString(getColumnIndexOrThrow(StructuredName.PHONETIC_MIDDLE_NAME)),
      phoneticFamilyName = getString(getColumnIndexOrThrow(StructuredName.PHONETIC_FAMILY_NAME))
    )
  }
}
