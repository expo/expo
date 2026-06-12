package expo.modules.contacts.next.domain.model.organization

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Organization
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.organization.operations.ExistingOrganization
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object OrganizationField : ExtractableField.Data<ExistingOrganization> {
  override val mimeType = Organization.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    DataId.COLUMN_IN_DATA_TABLE,
    Organization.COMPANY,
    Organization.DEPARTMENT,
    Organization.TITLE,
    Organization.PHONETIC_NAME
  )

  override fun extract(cursor: Cursor): ExistingOrganization = with(cursor) {
    return ExistingOrganization(
      dataId = DataId(getRequiredString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      company = getNullableString(getColumnIndexOrThrow(Organization.COMPANY)),
      department = getNullableString(getColumnIndexOrThrow(Organization.DEPARTMENT)),
      jobTitle = getNullableString(getColumnIndexOrThrow(Organization.TITLE)),
      phoneticName = getNullableString(getColumnIndexOrThrow(Organization.PHONETIC_NAME))
    )
  }
}
