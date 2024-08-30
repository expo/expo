package expo.modules.contacts.models

import android.content.ContentProviderOperation
import android.database.Cursor
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.Columns
import java.util.Locale

class DateModel : BaseModel() {
  override val contentType: String = CommonDataKinds.Event.CONTENT_ITEM_TYPE
  override val dataAlias: String = "date"

  override fun mapStringToType(label: String?): Int {
    return when (label) {
      "anniversary" -> CommonDataKinds.Event.TYPE_ANNIVERSARY
      "birthday" -> CommonDataKinds.Event.TYPE_BIRTHDAY
      "other" -> CommonDataKinds.Event.TYPE_OTHER
      else -> Columns.TYPE_CUSTOM
    }
  }

  override fun fromMap(readableMap: Map<String, Any?>) {
    super.fromMap(readableMap)

    val year = (readableMap["year"] as? Double)?.toInt()
    val month = (readableMap["month"] as? Double)?.toInt()
    val day = (readableMap["day"] as? Double)?.toInt()

    if (year != null) {
      map.putInt("year", year)
    }
    if (month != null) {
      map.putInt("month", month + 1)
    }
    if (day != null) {
      map.putInt("day", day)
    }
  }

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        CommonDataKinds.Event.TYPE_ANNIVERSARY -> "anniversary"
        CommonDataKinds.Event.TYPE_BIRTHDAY -> "birthday"
        CommonDataKinds.Event.TYPE_OTHER -> "other"
        else -> "unknown"
      }
  }

  override fun getInsertOperation(rawId: String?): ContentProviderOperation {
    val op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
    if (rawId == null) {
      op.withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
    } else {
      op.withValue(ContactsContract.Data.RAW_CONTACT_ID, rawId)
    }

    return op.withValue(Columns.MIMETYPE, contentType)
      .withValue(ContactsContract.CommonDataKinds.Event.TYPE, mapStringToType(label))
      .withValue(ContactsContract.CommonDataKinds.Event.START_DATE, formatDateString())
      .withValue(ContactsContract.CommonDataKinds.Event.LABEL, label)
      .build()
  }

  private fun formatDateString(): String? {
    val year = map.getInt("year", -1).takeIf { it > 0 }
    val month = map.getInt("month", -1).takeIf { it > 0 }
    val day = map.getInt("day", -1).takeIf { it > 0 }

    return when {
      year != null && month != null && day != null ->
        String.format(Locale.getDefault(), "%04d-%02d-%02d", year, month, day)

      month != null && day != null ->
        String.format(Locale.getDefault(), "--%02d-%02d", month, day)

      else -> null
    }
  }
}
