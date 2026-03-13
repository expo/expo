package expo.modules.contacts.next.domain.model.organization.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Organization
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.organization.OrganizationModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchOrganization(
  override val dataId: DataId,
  company: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  department: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  jobTitle: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  phoneticName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
) : Updatable.Data, OrganizationModel(
  company = company.optional,
  department = department.optional,
  jobTitle = jobTitle.optional,
  phoneticName = phoneticName.optional
) {
  override val contentValues = ContentValues().apply {
    if (!company.isUndefined) {
      put(Organization.COMPANY, company.optional)
    }
    if (!department.isUndefined) {
      put(Organization.DEPARTMENT, department.optional)
    }
    if (!jobTitle.isUndefined) {
      put(Organization.TITLE, jobTitle.optional)
    }
    if (!phoneticName.isUndefined) {
      put(Organization.PHONETIC_NAME, phoneticName.optional)
    }
  }
}
