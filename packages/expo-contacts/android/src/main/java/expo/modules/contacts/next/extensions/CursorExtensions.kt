package expo.modules.contacts.next.extensions

import android.database.Cursor

fun Cursor.asSequence(): Sequence<Cursor> = sequence {
  while (moveToNext()) {
    yield(this@asSequence)
  }
}

// This wrapper enforces null-safety, because the default getString() method returns String! type
fun Cursor.getNullableString(columnIndex: Int): String? =
  getString(columnIndex)

fun Cursor.getRequiredString(columnIndex: Int): String =
  getNullableString(columnIndex)
    ?: throw IllegalStateException("Column at index $columnIndex was null")

fun Cursor.getNullableInt(columnName: String): Int? {
  val columnIndex = getColumnIndexOrThrow(columnName)
  return if (isNull(columnIndex)) null else getInt(columnIndex)
}
