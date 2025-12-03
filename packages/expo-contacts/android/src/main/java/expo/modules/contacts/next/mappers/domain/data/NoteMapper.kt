package expo.modules.contacts.next.mappers.domain.data

import expo.modules.contacts.next.domain.model.note.operations.AppendableNote
import expo.modules.contacts.next.domain.model.note.operations.ExistingNote
import expo.modules.contacts.next.domain.model.note.operations.PatchNote
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.kotlin.types.ValueOrUndefined

object NoteMapper: MutableDataPropertyMapper<ExistingNote, String?> {
  override fun toDto(model: ExistingNote) = model.note

  override fun toUpdatable(dataId: DataId, newValue: String?) =
    PatchNote(dataId, note = ValueOrUndefined.Value(newValue))

  override fun toAppendable(newValue: String?, rawContactId: RawContactId) =
    AppendableNote(rawContactId = rawContactId, note = newValue)
}