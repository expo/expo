package expo.modules.contacts.next.domain.model.contact

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.ClearableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId

data class ContactPatch(
  val contactId: ContactId,
  val toClear: List<ClearableField>,
  val toAppend: List<Appendable>,
  val toUpdate: List<Updatable>
) {
  fun toPatchOperations() = buildList {
    addAll(toClear.map { it.toClearOperation(contactId) })
    addAll(toAppend.map { it.toAppendOperation() })
    addAll(toUpdate.map { it.toUpdateOperation() })
  }
}
