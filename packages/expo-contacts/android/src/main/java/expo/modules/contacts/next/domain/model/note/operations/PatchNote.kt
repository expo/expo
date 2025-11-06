package expo.modules.contacts.next.domain.model.note.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Note
import expo.modules.contacts.next.domain.model.Patchable
import expo.modules.contacts.next.domain.model.note.NoteModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchNote(
  override val dataId: DataId,
  note: ValueOrUndefined<String?>
) : NoteModel(note.optional), Patchable {
  override val contentValues = ContentValues().apply {
    if (!note.isUndefined) {
      put(Note.NOTE, note.optional)
    }
  }
}
