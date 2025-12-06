package expo.modules.contacts.next.domain.model.structuredpostal

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.StructuredPostal

abstract class StructuredPostalModel(
  val street: String?,
  val city: String?,
  val region: String?,
  val postcode: String?,
  val country: String?,
  val label: StructuredPostalLabel
) {
  val mimeType = StructuredPostal.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(StructuredPostal.STREET, street)
      put(StructuredPostal.CITY, city)
      put(StructuredPostal.REGION, region)
      put(StructuredPostal.POSTCODE, postcode)
      put(StructuredPostal.COUNTRY, country)
      put(StructuredPostal.TYPE, label.type)
      put(StructuredPostal.LABEL, label.label)
    }
}
