package expo.modules.contacts.next.domain.model.nickname.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Nickname
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.nickname.NicknameLabel
import expo.modules.contacts.next.domain.model.nickname.NicknameModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchNickname(
  override val dataId: DataId,
  name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  label: ValueOrUndefined<NicknameLabel> = ValueOrUndefined.Undefined()
) : NicknameModel(name.optional, label.optional ?: NicknameLabel.Custom("")), Updatable.Data {
  override val contentValues = ContentValues().apply {
    if (!name.isUndefined) {
      put(Nickname.NAME, name.optional)
    }
    if (!label.isUndefined) {
      put(Nickname.TYPE, label.optional?.type)
      put(Nickname.LABEL, label.optional?.label)
    }
  }
}
