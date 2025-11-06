package expo.modules.contacts.next.domain.model.note

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Note
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.note.operations.ExistingNote
import expo.modules.contacts.next.domain.wrappers.DataId

object NoteField : ExtractableField<ExistingNote> {
  override val projection = arrayOf(
    Note._ID,
    Note.NOTE
  )

  override val mimeType = Note.CONTENT_ITEM_TYPE

  override fun extract(cursor: Cursor) =
    ExistingNote(
      dataId = DataId(cursor.getString(cursor.getColumnIndexOrThrow(Note._ID))),
      note = cursor.getString(cursor.getColumnIndexOrThrow(Note.NOTE))
    )
}
