package expo.modules.contacts.next.domain.model.email

import android.provider.ContactsContract.CommonDataKinds.Email

sealed class EmailLabel {
  abstract val type: Int
  abstract val label: String?

  object Home : EmailLabel() {
    override val type = Email.TYPE_HOME
    override val label = "home"
  }

  object Work : EmailLabel() {
    override val type = Email.TYPE_WORK
    override val label = "work"
  }

  object Other : EmailLabel() {
    override val type = Email.TYPE_OTHER
    override val label = "other"
  }

  object Mobile : EmailLabel() {
    override val type = Email.TYPE_MOBILE
    override val label = "mobile"
  }

  data class Custom(override val label: String?) : EmailLabel() {
    override val type = Email.TYPE_CUSTOM
  }

  object Unknown : EmailLabel() {
    override val type = -1
    override val label = "unknown"
  }
}
