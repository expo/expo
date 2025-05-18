package expo.modules.contacts.models

import android.content.ContentProviderOperation
import android.database.Cursor
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.Columns
import java.util.Locale
import android.util.Log
const val BIRTHDAY = "birthday"
private const val ANNIVERSARY = "anniversary"
private const val OTHER = "other"

open class DateModel : BaseModel() {
  override val contentType: String = CommonDataKinds.Event.CONTENT_ITEM_TYPE
  override val dataAlias: String = "date"

  override fun mapStringToType(label: String?): Int {
    return when (label) {
      ANNIVERSARY -> CommonDataKinds.Event.TYPE_ANNIVERSARY
      BIRTHDAY -> CommonDataKinds.Event.TYPE_BIRTHDAY
      OTHER -> CommonDataKinds.Event.TYPE_OTHER
      else -> Columns.TYPE_CUSTOM
    }
  }

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        CommonDataKinds.Event.TYPE_ANNIVERSARY -> ANNIVERSARY
        CommonDataKinds.Event.TYPE_BIRTHDAY -> BIRTHDAY
        CommonDataKinds.Event.TYPE_OTHER -> OTHER
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
      .withValue(CommonDataKinds.Event.TYPE, mapStringToType(label))
      .withValue(CommonDataKinds.Event.START_DATE, formatDateString())
      .withValue(CommonDataKinds.Event.LABEL, label)
      .build()
  }

  private fun formatDateString(): String? {
    var year = map.getDouble("year", -1.0).toInt().takeIf { it > 0 }
    var month = map.getDouble("month", -1.0).toInt().takeIf { it >= 0 }?.plus(1) // URI month is 1-indexed
    var day = map.getDouble("day", -1.0).toInt().takeIf { it > 0 }

    // If year, month, or day are not in the map (e.g., when loaded from DB rather than JS object),
    // try to parse them from the raw `data` field.
    if ((year == null || month == null || day == null) && this.data != null) {
      val dateStr = this.data!!
      try {
        if (dateStr.startsWith("--")) { // Format like --MM-DD
          if (dateStr.length >= "--MM-DD".length) {
            month = dateStr.substring(2, 4).toInt().takeIf { it in 1..12 }
            day = dateStr.substring(5, 7).toInt().takeIf { it in 1..31 }
            year = null // Explicitly null for no-year format
          }
        } else { // Format like YYYY-MM-DD
          if (dateStr.length >= "YYYY-MM-DD".length) {
            year = dateStr.substring(0, 4).toInt().takeIf { it > 0 }
            month = dateStr.substring(5, 7).toInt().takeIf { it in 1..12 }
            day = dateStr.substring(8, 10).toInt().takeIf { it in 1..31 }
          }
        }
      } catch (e: NumberFormatException) {
        Log.e("DateModel", "Error parsing date string: $dateStr", e)
        // Log or handle parsing error if necessary, otherwise proceed with potentially null components
      }
    }

    return when {
      year != null && month != null && day != null ->
        String.format(Locale.US, "%04d-%02d-%02d", year, month, day)

      month != null && day != null -> // No year
        String.format(Locale.US, "--%02d-%02d", month, day)

      else -> null
    }
  }
}
