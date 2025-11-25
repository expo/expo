package expo.modules.contacts.next.domain.model.structuredpostal.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.StructuredPostal
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalLabel
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchStructuredPostal(
  override val dataId: DataId,
  street: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  city: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  region: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  postcode: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  country: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<StructuredPostalLabel> = ValueOrUndefined.Undefined()
) : StructuredPostalModel(
  street = street.optional,
  city = city.optional,
  region = region.optional,
  postcode = postcode.optional,
  country = country.optional,
  label = label.optional ?: StructuredPostalLabel.Unknown
),
  Updatable.Data {
  override val contentValues = ContentValues().apply {
    if (!street.isUndefined) {
      put(StructuredPostal.STREET, street.optional)
    }
    if (!city.isUndefined) {
      put(StructuredPostal.CITY, city.optional)
    }
    if (!region.isUndefined) {
      put(StructuredPostal.REGION, region.optional)
    }
    if (!postcode.isUndefined) {
      put(StructuredPostal.POSTCODE, postcode.optional)
    }
    if (!country.isUndefined) {
      put(StructuredPostal.COUNTRY, country.optional)
    }
    if (!label.isUndefined) {
      put(StructuredPostal.TYPE, label.optional?.type)
      put(StructuredPostal.LABEL, label.optional?.label)
    }
  }
}
