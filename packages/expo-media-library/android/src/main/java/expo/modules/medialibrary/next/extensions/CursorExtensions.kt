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
