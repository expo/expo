package expo.modules.contacts.next.domain.model.note.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.note.NoteModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendableNote(
  override val rawContactId: RawContactId,
  note: String?
) : NoteModel(note), Appendable
