package expo.modules.contacts.next.domain.model.structuredpostal.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalLabel
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableStructuredPostal(
  override val rawContactId: RawContactId,
  street: String?,
  city: String?,
  region: String?,
  postcode: String?,
  country: String?,
  label: StructuredPostalLabel
) : StructuredPostalModel(
  street = street,
  city = city,
  region = region,
  postcode = postcode,
  country = country,
  label = label
),
  Appendable
