package expo.modules.contacts.models

import android.content.ContentProviderOperation
import android.database.Cursor
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.Columns
import java.text.SimpleDateFormat
import java.util.Calendar
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
    val dateString = parseDateFromMap(readableMap) as String?
    val hasYear = !dateString!!.startsWith("--")
    val calendar = Calendar.getInstance()
    val datePattern = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val noYearPattern = SimpleDateFormat("--MM-dd", Locale.getDefault())
    try {
      if (hasYear) {
        calendar.time = datePattern.parse(dateString)!!
      } else {
        calendar.time = noYearPattern.parse(dateString)!!
      }
    } catch (e: Exception) {
      // TODO: ??
    }
    if (hasYear) {
      map.putInt("year", calendar[Calendar.YEAR])
    }
    map.putInt("month", calendar[Calendar.MONTH] + 1)
    map.putInt("day", calendar[Calendar.DAY_OF_MONTH])
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

  private fun parseDateFromMap(dateMap: Map<String, Any?>): String? {
    val year = (dateMap["year"] as? Double)?.toInt()
    val month = (dateMap["month"] as? Double)?.toInt()
    val day = (dateMap["day"] as? Double)?.toInt()

    return if (year != null && month != null && day != null) {
      val calendar = Calendar.getInstance()
      calendar.set(Calendar.YEAR, year)
      calendar.set(Calendar.MONTH, month) 
      calendar.set(Calendar.DAY_OF_MONTH, day)

      val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
      dateFormat.format(calendar.time)
    } else {
      null
    }
  }

  private fun formatDateString(): String? {
    val year = map.getInt("year", -1)
    val month = map.getInt("month", -1)
    val day = map.getInt("day", -1)

    return if (year > 0 && month > 0 && day > 0) {
      String.format(Locale.getDefault(), "%04d-%02d-%02d", year, month, day)
    } else {
      null
    }
  }
}
