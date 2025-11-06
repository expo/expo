package expo.modules.contacts.next.domain.model.structuredname.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingStructuredName(
  override val dataId: DataId,
  givenName: String?,
  middleName: String?,
  familyName: String?,
  prefix: String?,
  suffix: String?,
  phoneticGivenName: String?,
  phoneticMiddleName: String?,
  phoneticFamilyName: String?
) : StructuredNameModel(
  givenName,
  middleName,
  familyName,
  prefix,
  suffix,
  phoneticGivenName,
  phoneticMiddleName,
  phoneticFamilyName
),
  Updatable,
  Extractable
