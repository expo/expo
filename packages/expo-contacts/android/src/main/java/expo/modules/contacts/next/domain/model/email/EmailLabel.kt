package expo.modules.contacts.next.domain.model.email

import android.provider.ContactsContract.CommonDataKinds.Email

sealed class EmailLabel(val type: Int, val label: String? = null) {
  object Home : EmailLabel(Email.TYPE_HOME)
  object Work : EmailLabel(Email.TYPE_WORK)
  object Other : EmailLabel(Email.TYPE_OTHER)
  object Mobile : EmailLabel(Email.TYPE_MOBILE)
  class Custom(label: String) : EmailLabel(Email.TYPE_CUSTOM, label)
}
