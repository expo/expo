package expo.modules.contacts.next.domain.model.nickname

import android.provider.ContactsContract.CommonDataKinds.Nickname

sealed class NicknameLabel(val type: Int, val label: String? = null) {
  object Default : NicknameLabel(Nickname.TYPE_DEFAULT)
  object OtherName : NicknameLabel(Nickname.TYPE_OTHER_NAME)
  object MaidenName : NicknameLabel(Nickname.TYPE_MAIDEN_NAME)
  object ShortName : NicknameLabel(Nickname.TYPE_SHORT_NAME)
  object Initials : NicknameLabel(Nickname.TYPE_INITIALS)
  class Custom(label: String) : NicknameLabel(Nickname.TYPE_CUSTOM, label)
}
