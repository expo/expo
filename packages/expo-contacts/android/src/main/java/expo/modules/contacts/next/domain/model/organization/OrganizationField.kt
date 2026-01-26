package expo.modules.contacts.next.domain.model.organization

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Organization
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.organization.operations.ExistingOrganization
import expo.modules.contacts.next.domain.wrappers.DataId

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
      dataId = DataId(getString(getColumnIndexOrThrow(DataId.COLUMN_IN_DATA_TABLE))),
      company = getString(getColumnIndexOrThrow(Organization.COMPANY)),
      department = getString(getColumnIndexOrThrow(Organization.DEPARTMENT)),
      jobTitle = getString(getColumnIndexOrThrow(Organization.TITLE)),
      phoneticName = getString(getColumnIndexOrThrow(Organization.PHONETIC_NAME))
    )
  }
}
