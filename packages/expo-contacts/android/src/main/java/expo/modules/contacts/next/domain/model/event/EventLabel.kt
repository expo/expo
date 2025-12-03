package expo.modules.contacts.next.domain.model.event

import android.provider.ContactsContract

sealed class EventLabel {
  abstract val type: Int
  open val label: String? = null

  object Anniversary : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_ANNIVERSARY
  }

  object Birthday : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY
  }

  object Other : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_OTHER
  }

  data class Custom(override val label: String) : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_CUSTOM
  }
}
