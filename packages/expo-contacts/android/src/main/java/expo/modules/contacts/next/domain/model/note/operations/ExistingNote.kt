package expo.modules.contacts.next.domain.model.note.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.note.NoteModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingNote(
  override val dataId: DataId,
  note: String
) : NoteModel(note), Extractable.Data, Updatable.Data
