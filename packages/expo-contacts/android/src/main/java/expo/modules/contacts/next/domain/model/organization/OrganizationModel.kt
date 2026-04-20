package expo.modules.contacts.next.domain.model.organization

import android.content.ContentValues
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Organization

abstract class OrganizationModel(
  val company: String?,
  val department: String?,
  val jobTitle: String?,
  val phoneticName: String?
) {
  val mimeType = Organization.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(ContactsContract.Data.MIMETYPE, mimeType)
      put(Organization.COMPANY, company)
      put(Organization.DEPARTMENT, department)
      put(Organization.TITLE, jobTitle)
      put(Organization.PHONETIC_NAME, phoneticName)
    }
}
