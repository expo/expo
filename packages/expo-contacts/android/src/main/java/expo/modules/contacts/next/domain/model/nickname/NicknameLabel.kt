package expo.modules.contacts.next.domain.model.nickname

import android.provider.ContactsContract.CommonDataKinds.Nickname

sealed class NicknameLabel {
  abstract val type: Int
  open val label: String? = null

  object Default : NicknameLabel() {
    override val type = Nickname.TYPE_DEFAULT
  }

  object OtherName : NicknameLabel() {
    override val type = Nickname.TYPE_OTHER_NAME
  }

  object MaidenName : NicknameLabel() {
    override val type = Nickname.TYPE_MAIDEN_NAME
  }

  object ShortName : NicknameLabel() {
    override val type = Nickname.TYPE_SHORT_NAME
  }

  object Initials : NicknameLabel() {
    override val type = Nickname.TYPE_INITIALS
  }

  data class Custom(override val label: String) : NicknameLabel() {
    override val type = Nickname.TYPE_CUSTOM
  }
}
