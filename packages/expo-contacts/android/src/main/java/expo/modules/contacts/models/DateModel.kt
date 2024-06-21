package expo.modules.contacts.models

import android.database.Cursor
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
    val dateString = readableMap["date"] as String?
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
}
