package expo.modules.contacts.next.domain.model.structuredname.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableStructuredName(
  override val rawContactId: RawContactId,
  givenName: String? = null,
  middleName: String? = null,
  familyName: String? = null,
  prefix: String? = null,
  suffix: String? = null,
  phoneticGivenName: String? = null,
  phoneticMiddleName: String? = null,
  phoneticFamilyName: String? = null
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
  Appendable
