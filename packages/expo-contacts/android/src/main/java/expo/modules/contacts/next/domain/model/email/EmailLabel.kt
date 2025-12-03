package expo.modules.contacts.next.domain.model.email

import android.provider.ContactsContract.CommonDataKinds.Email

sealed class EmailLabel {
  abstract val type: Int
  open val label: String? = null

  object Home : EmailLabel() {
    override val type = Email.TYPE_HOME
  }

  object Work : EmailLabel() {
    override val type = Email.TYPE_WORK
  }

  object Other : EmailLabel() {
    override val type = Email.TYPE_OTHER
  }

  object Mobile : EmailLabel() {
    override val type = Email.TYPE_MOBILE
  }

  data class Custom(override val label: String) : EmailLabel() {
    override val type = Email.TYPE_CUSTOM
  }
}
