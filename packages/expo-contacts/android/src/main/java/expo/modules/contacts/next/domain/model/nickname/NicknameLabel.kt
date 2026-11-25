package expo.modules.contacts.next.domain.model.nickname

import android.provider.ContactsContract.CommonDataKinds.Nickname

sealed class NicknameLabel(val type: Int?, val label: String? = null) {
  object Default : NicknameLabel(Nickname.TYPE_DEFAULT)
  object OtherName : NicknameLabel(Nickname.TYPE_OTHER_NAME)
  object MaidenName : NicknameLabel(Nickname.TYPE_MAIDEN_NAME)
  object ShortName : NicknameLabel(Nickname.TYPE_SHORT_NAME)
  object Initials : NicknameLabel(Nickname.TYPE_INITIALS)
  class Custom(label: String) : NicknameLabel(Nickname.TYPE_CUSTOM, label)

  // Ideally these states would not be necessary, but Android does not enforce
  // type and label columns as non-null, so malformed label data can exist there.
  class MalformedType(label: String?) : NicknameLabel(null, label)
  object MalformedCustom : NicknameLabel(Nickname.TYPE_CUSTOM)
}
