package expo.modules.contacts.next.domain.model.structuredname.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.StructuredName
import expo.modules.contacts.next.domain.model.Patchable
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchStructuredName(
  override val dataId: DataId,
  givenName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  middleName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  familyName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  prefix: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  suffix: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  phoneticGivenName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  phoneticMiddleName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  phoneticFamilyName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
) : StructuredNameModel(
  givenName = givenName.optional,
  middleName = middleName.optional,
  familyName = familyName.optional,
  prefix = prefix.optional,
  suffix = suffix.optional,
  phoneticGivenName = phoneticGivenName.optional,
  phoneticMiddleName = phoneticMiddleName.optional,
  phoneticFamilyName = phoneticFamilyName.optional
),
  Patchable {
  override val contentValues = ContentValues().apply {
    if (!givenName.isUndefined) {
      put(StructuredName.GIVEN_NAME, givenName.optional)
    }
    if (!middleName.isUndefined) {
      put(StructuredName.MIDDLE_NAME, middleName.optional)
    }
    if (!familyName.isUndefined) {
      put(StructuredName.FAMILY_NAME, familyName.optional)
    }
    if (!prefix.isUndefined) {
      put(StructuredName.PREFIX, prefix.optional)
    }
    if (!suffix.isUndefined) {
      put(StructuredName.SUFFIX, suffix.optional)
    }
    if (!phoneticGivenName.isUndefined) {
      put(StructuredName.PHONETIC_GIVEN_NAME, phoneticGivenName.optional)
    }
    if (!phoneticMiddleName.isUndefined) {
      put(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName.optional)
    }
    if (!phoneticFamilyName.isUndefined) {
      put(StructuredName.PHONETIC_FAMILY_NAME, phoneticFamilyName.optional)
    }
  }
}
