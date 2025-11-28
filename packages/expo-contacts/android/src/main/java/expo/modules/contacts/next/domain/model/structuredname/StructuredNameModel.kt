package expo.modules.contacts.next.domain.model.structuredname

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.StructuredName

abstract class StructuredNameModel(
  val givenName: String?,
  val middleName: String?,
  val familyName: String?,
  val prefix: String?,
  val suffix: String?,
  val phoneticGivenName: String?,
  val phoneticMiddleName: String?,
  val phoneticFamilyName: String?
) {
  val mimeType = StructuredName.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(StructuredName.GIVEN_NAME, givenName)
      put(StructuredName.MIDDLE_NAME, middleName)
      put(StructuredName.FAMILY_NAME, familyName)
      put(StructuredName.PREFIX, prefix)
      put(StructuredName.SUFFIX, suffix)
      put(StructuredName.PHONETIC_GIVEN_NAME, phoneticGivenName)
      put(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      put(StructuredName.PHONETIC_FAMILY_NAME, phoneticFamilyName)
    }
}
