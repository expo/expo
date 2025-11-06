package expo.modules.contacts.next.services.property

import expo.modules.contacts.next.domain.model.note.operations.AppendableNote
import expo.modules.contacts.next.domain.model.note.operations.ExistingNote
import expo.modules.contacts.next.domain.model.note.operations.PatchNote
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.kotlin.types.ValueOrUndefined

sealed class NoteProperty {
  object Note : PropertyAccessor<ExistingNote, String> {
    override fun extractFrom(model: ExistingNote) = model.note
    override fun toFieldPatchable(dataId: DataId, newValue: String?) =
      PatchNote(dataId, note = ValueOrUndefined.Value(newValue))

    override fun toFieldAppendable(newValue: String?, rawContactId: RawContactId) =
      AppendableNote(rawContactId = rawContactId, note = newValue)
  }
}
