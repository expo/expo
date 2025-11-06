package expo.modules.contacts.next.domain.model

import android.database.Cursor

interface ExtractableField<T : Extractable> {
  val projection: Array<String>
  val mimeType: String
  fun extract(cursor: Cursor): T
}
