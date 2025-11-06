package expo.modules.contacts.next.domain.model.note.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.note.NoteModel

class NewNote(
  note: String?
) : NoteModel(note), Insertable
