package expo.modules.contacts.next.domain.model.structuredpostal.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalLabel
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingStructuredPostal(
  override val dataId: DataId,
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
  Updatable.Data,
  Extractable.Data
