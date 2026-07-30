package expo.modules.medialibrary.next.extensions

import android.database.Cursor

fun Cursor.asIterable(): Iterable<Cursor> {
  return object : Iterable<Cursor> {
    override fun iterator(): Iterator<Cursor> = object : Iterator<Cursor> {
      private var hasNextCalled = false
      private var hasNextCache = false

      override fun hasNext(): Boolean {
        if (!hasNextCalled) {
          hasNextCache = moveToNext()
          hasNextCalled = true
        }
        return hasNextCache
      }

      override fun next(): Cursor {
        if (!hasNextCalled) {
          if (!moveToNext()) throw NoSuchElementException()
        }
        hasNextCalled = false
        return this@asIterable
      }
    }
  }
}

fun Cursor.asSequence(): Sequence<Cursor> {
  return sequence {
    while (moveToNext()) {
      yield(this@asSequence)
    }
  }
}

// This wrapper enforces null-safety, because the default getString() method returns String! type
fun Cursor.getNullableString(columnIndex: Int): String? =
  getString(columnIndex)

fun Cursor.getNullableInt(columnIndex: Int): Int? =
  if (isNull(columnIndex)) {
    null
  } else {
    getInt(columnIndex)
  }

fun Cursor.getNullableLong(columnIndex: Int): Long? =
  if (isNull(columnIndex)) {
    null
  } else {
    getLong(columnIndex)
  }
