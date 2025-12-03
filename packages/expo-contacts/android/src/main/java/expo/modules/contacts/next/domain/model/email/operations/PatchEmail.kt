package expo.modules.contacts.next.domain.model.email.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Email
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.email.EmailModel
import expo.modules.contacts.next.domain.model.email.EmailLabel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchEmail(
  override val dataId: DataId,
  address: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<EmailLabel> = ValueOrUndefined.Undefined()
) : EmailModel(address.optional, label.optional ?: EmailLabel.Custom("other")), Updatable.Data {
  override val contentValues = ContentValues().apply {
    if (!address.isUndefined) {
      put(Email.ADDRESS, address.optional)
    }
    if (!label.isUndefined) {
      put(Email.TYPE, label.optional?.type)
      put(Email.LABEL, label.optional?.label)
    }
  }
}
