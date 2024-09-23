package expo.modules.contacts.models

import android.content.ContentProviderOperation
import android.content.ContentValues
import android.database.Cursor
import android.provider.ContactsContract
import expo.modules.contacts.Columns

class PostalAddressModel : BaseModel() {
  override val contentType: String = ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE
  override val dataAlias: String = "formattedAddress"

  override fun mapStringToType(label: String?): Int {
    val postalAddressType = when (label) {
      "home" -> ContactsContract.CommonDataKinds.StructuredPostal.TYPE_HOME
      "work" -> ContactsContract.CommonDataKinds.StructuredPostal.TYPE_WORK
      "other" -> ContactsContract.CommonDataKinds.StructuredPostal.TYPE_OTHER
      else -> ContactsContract.CommonDataKinds.StructuredPostal.TYPE_OTHER
    }
    return postalAddressType
  }

  override fun fromCursor(cursor: Cursor) {
    super.fromCursor(cursor)
    putString(cursor, "formattedAddress", ContactsContract.CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS)
    putString(cursor, "street", ContactsContract.CommonDataKinds.StructuredPostal.STREET)
    putString(cursor, "poBox", ContactsContract.CommonDataKinds.StructuredPostal.POBOX)
    putString(cursor, "neighborhood", ContactsContract.CommonDataKinds.StructuredPostal.NEIGHBORHOOD)
    putString(cursor, "city", ContactsContract.CommonDataKinds.StructuredPostal.CITY)
    putString(cursor, "region", ContactsContract.CommonDataKinds.StructuredPostal.REGION)
    putString(cursor, "state", ContactsContract.CommonDataKinds.StructuredPostal.REGION)
    putString(cursor, "postalCode", ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE)
    putString(cursor, "country", ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY)
  }

  override fun fromMap(readableMap: Map<String, Any?>) {
    super.fromMap(readableMap)
    mapValue(readableMap, "region", "state")
  }

  override fun getInsertOperation(rawId: String?): ContentProviderOperation {
    val op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
    if (rawId == null) {
      op.withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
    } else {
      op.withValue(ContactsContract.Data.RAW_CONTACT_ID, rawId)
    }
    return op.withValue(Columns.MIMETYPE, contentType)
      .withValue(ContactsContract.CommonDataKinds.StructuredPostal.TYPE, type)
      .withValue(ContactsContract.CommonDataKinds.StructuredPostal.STREET, getString("street"))
      .withValue(ContactsContract.CommonDataKinds.StructuredPostal.CITY, getString("city"))
      .withValue(ContactsContract.CommonDataKinds.StructuredPostal.REGION, getString("region"))
      .withValue(ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE, getString("postalCode"))
      .withValue(ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY, getString("country"))
      .build()
  }

  override val contentValues: ContentValues
    get() {
      val values = super.contentValues
      values.put(ContactsContract.CommonDataKinds.StructuredPostal.STREET, getString("street"))
      values.put(ContactsContract.CommonDataKinds.StructuredPostal.CITY, getString("city"))
      values.put(ContactsContract.CommonDataKinds.StructuredPostal.REGION, getString("region"))
      values.put(ContactsContract.CommonDataKinds.StructuredPostal.COUNTRY, getString("country"))
      values.put(ContactsContract.CommonDataKinds.StructuredPostal.POSTCODE, getString("postalCode"))
      return values
    }

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        ContactsContract.CommonDataKinds.StructuredPostal.TYPE_HOME -> "home"
        ContactsContract.CommonDataKinds.StructuredPostal.TYPE_WORK -> "work"
        ContactsContract.CommonDataKinds.StructuredPostal.TYPE_OTHER -> "other"
        else -> "unknown"
      }
  }
}
