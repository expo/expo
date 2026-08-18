package expo.modules.contacts.next.domain.model.note

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Note
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.note.operations.ExistingNote
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.extensions.getNullableString
import expo.modules.contacts.next.extensions.getRequiredString

object NoteField : ExtractableField.Data<ExistingNote> {
  override val projection = arrayOf(
    Note._ID,
    Note.NOTE
  )

  override val mimeType = Note.CONTENT_ITEM_TYPE

  override fun extract(cursor: Cursor) =
    ExistingNote(
      dataId = DataId(cursor.getRequiredString(cursor.getColumnIndexOrThrow(Note._ID))),
      note = cursor.getNullableString(cursor.getColumnIndexOrThrow(Note.NOTE))
    )
}
