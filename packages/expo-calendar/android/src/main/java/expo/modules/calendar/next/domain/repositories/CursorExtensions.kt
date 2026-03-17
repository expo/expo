package expo.modules.calendar.next.domain.repositories

import android.database.Cursor
import android.util.Log
import expo.modules.calendar.CalendarModule
import expo.modules.calendar.exceptions.ColumnMissingException

internal fun Cursor.getOptionalLong(columnName: String): Long? {
  val index = getColumnIndexOrThrow(columnName)
  // Given that getLong() will return 0 for null values:
  if (isNull(index)) {
    return null
  }
  return getLong(index)
}

internal fun Cursor.getOptionalInt(columnName: String): Int? {
  val index = getColumnIndexOrThrow(columnName)
  // Given that getInt() will return 0 for null values:
  if (isNull(index)) {
    return null
  }
  return getInt(index)
}

internal fun Cursor.getOptionalString(columnName: String): String? {
  val index = getColumnIndexOrThrow(columnName)
  if (index == -1) {
    return null
  }
  return getString(index)
}

internal fun Cursor.getRequiredString(columnName: String): String {
  return getOptionalString(columnName)
    ?: throw ColumnMissingException("String value not found for column `$columnName`")
}

internal fun <T> Cursor.getList(columnName: String, mapper: (v: Int) -> T): List<T> =
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

fun Cursor.asSequence(): Sequence<Cursor> = sequence {
  while (moveToNext()) {
    yield(this@asSequence)
  }
}
