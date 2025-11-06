package expo.modules.contacts.next.domain.model.contact

import android.content.ContentProviderOperation
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
  fun toPatchOperations(): ArrayList<ContentProviderOperation> {
    val operations = arrayListOf<ContentProviderOperation>()
    operations.addAll(fieldsToClear.map { it.toClearOperation(contactId) })
    operations.addAll(modelsToAppend.map { it.toAppendOperation() })
    operations.addAll(modelsToPatch.map { it.toPatchOperation() })
    return operations
  }
}
