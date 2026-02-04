package expo.modules.contacts.next.domain.model.structuredpostal.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalLabel
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalModel

class NewStructuredPostal(
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
  Insertable
