package expo.modules.contacts.next.domain.model.event

import android.provider.ContactsContract.CommonDataKinds.Event

sealed class EventLabel(val type: Int, val label: String? = null) {
  object Anniversary : EventLabel(Event.TYPE_ANNIVERSARY)
  object Birthday : EventLabel(Event.TYPE_BIRTHDAY)
  object Other : EventLabel(Event.TYPE_OTHER)
  class Custom(label: String) : EventLabel(Event.TYPE_CUSTOM, label)
}
