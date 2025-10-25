package expo.modules.calendar.extensions

import android.database.Cursor
import android.util.Log
import expo.modules.calendar.CalendarModule
import expo.modules.calendar.exceptions.ColumnMissingException
import kotlin.jvm.Throws

fun Cursor.getOptionalString(columnName: String): String? {
  return getColumnIndex(columnName)
    .takeIf { it >= 0 }
    ?.let { getString(it) }
}

@Throws(ColumnMissingException::class)
fun Cursor.getRequiredString(columnName: String): String {
  return getOptionalString(columnName)
    ?: throw ColumnMissingException("String value not found for column `$columnName`")
}

fun Cursor.getIntOrDefault(columnName: String, default: Int = 0): Int {
  return getColumnIndex(columnName)
    .takeIf { it >= 0 }
    ?.let { getInt(it) }
    ?: default
}

fun <T> Cursor.getValueList(columnName: String, mapper: (v: Int) -> T): List<T> =
  getRequiredString(columnName)
    .split(",")
    .mapNotNull { v ->
      try {
        mapper(v.toInt())
      } catch (e: NumberFormatException) {
        Log.e(CalendarModule.TAG, "Couldn't convert value constant into an int.", e)
        null
      }
    }
    .toList()
