package expo.modules.contacts.next.extensions

import android.database.Cursor

fun Cursor.asSequence(): Sequence<Cursor> = sequence {
  while (moveToNext()) {
    yield(this@asSequence)
  }
}
