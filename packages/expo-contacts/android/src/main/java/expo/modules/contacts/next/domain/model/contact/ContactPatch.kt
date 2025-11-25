package expo.modules.contacts.next.domain.model.contact

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.Patchable
import expo.modules.contacts.next.domain.wrappers.ContactId

data class ContactPatch(
  val contactId: ContactId,
  val fieldsToClear: List<ClearableField>,
  val modelsToAppend: List<Appendable>,
  val modelsToPatch: List<Patchable>
) {
  fun toPatchOperations() = buildList {
    addAll(fieldsToClear.map { it.toClearOperation(contactId) })
    addAll(modelsToAppend.map { it.toAppendOperation() })
    addAll(modelsToPatch.map { it.toPatchOperation() })
  }
}
