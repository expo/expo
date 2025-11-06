package expo.modules.contacts.next.domain.model.note

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Note

abstract class NoteModel(val note: String?) {
  val mimeType = Note.CONTENT_ITEM_TYPE
  open val contentValues = ContentValues().apply {
    put(Note.NOTE, note)
  }
}
