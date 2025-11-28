package expo.modules.contacts.next.domain.model.nickname

import android.provider.ContactsContract.CommonDataKinds.Nickname

sealed class NicknameLabel {
  abstract val type: Int
  abstract val label: String?

  object Default : NicknameLabel() {
    override val type = Nickname.TYPE_DEFAULT
    override val label: String? = null
  }

  object OtherName : NicknameLabel() {
    override val type = Nickname.TYPE_OTHER_NAME
    override val label = "otherName"
  }

  object MaidenName : NicknameLabel() {
    override val type = Nickname.TYPE_MAIDEN_NAME
    override val label = "maidenName"
  }

  object ShortName : NicknameLabel() {
    override val type = Nickname.TYPE_SHORT_NAME
    override val label = "shortName"
  }

  object Initials : NicknameLabel() {
    override val type = Nickname.TYPE_INITIALS
    override val label = "initials"
  }

  data class Custom(override val label: String) : NicknameLabel() {
    override val type = Nickname.TYPE_CUSTOM
  }

  object Unknown : NicknameLabel() {
    override val type = Nickname.TYPE_CUSTOM
    override val label = "unknown"
  }
}
