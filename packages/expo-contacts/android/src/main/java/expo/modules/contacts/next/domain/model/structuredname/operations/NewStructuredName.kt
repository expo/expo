package expo.modules.contacts.next.domain.model.structuredname.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameModel

class NewStructuredName(
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
  Insertable
