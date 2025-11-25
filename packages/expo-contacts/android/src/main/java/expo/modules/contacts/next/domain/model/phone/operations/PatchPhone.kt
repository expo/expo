package expo.modules.contacts.next.domain.model.phone.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Phone
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.phone.PhoneLabel
import expo.modules.contacts.next.domain.model.phone.PhoneModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchPhone(
  override val dataId: DataId,
  number: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<PhoneLabel> = ValueOrUndefined.Undefined()
) : PhoneModel(number.optional, label.optional ?: PhoneLabel.Unknown), Updatable.Data {
  override val contentValues = ContentValues().apply {
    if (!number.isUndefined) {
      put(Phone.NUMBER, number.optional)
    }
    if (!label.isUndefined) {
      put(Phone.TYPE, label.optional?.type)
      put(Phone.LABEL, label.optional?.label)
    }
  }
}
