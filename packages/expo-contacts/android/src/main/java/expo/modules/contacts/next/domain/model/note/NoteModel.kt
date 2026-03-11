package expo.modules.contacts.next.domain.model.note

import android.content.ContentValues
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Note

abstract class NoteModel(val note: String?) {
  val mimeType = Note.CONTENT_ITEM_TYPE
  open val contentValues = ContentValues().apply {
    put(ContactsContract.Data.MIMETYPE, mimeType)
    put(Note.NOTE, note)
  }
}
