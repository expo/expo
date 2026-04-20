package expo.modules.contacts.next.domain.model.contact

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId

data class ContactPatch(
  val contactId: ContactId,
  val modifiedFields: Set<ExtractableField.Data<*>>,
  val toAppend: List<Appendable>,
  val toUpdate: List<Updatable>
) {
  fun toPatchOperations() = buildList {
    addAll(toAppend.map { it.toAppendOperation() })
    addAll(toUpdate.map { it.toUpdateOperation() })
  }
}
