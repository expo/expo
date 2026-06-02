package expo.modules.contacts.next.domain.model.event

import android.provider.ContactsContract.CommonDataKinds.Event

sealed class EventLabel(val type: Int?, val label: String? = null) {
  object Anniversary : EventLabel(Event.TYPE_ANNIVERSARY)
  object Birthday : EventLabel(Event.TYPE_BIRTHDAY)
  object Other : EventLabel(Event.TYPE_OTHER)
  class Custom(label: String) : EventLabel(Event.TYPE_CUSTOM, label)

  // Ideally these states would not be necessary, but Android does not enforce
  // type and label columns as non-null, so malformed label data can exist there.
  class MalformedType(label: String?) : EventLabel(null, label)
  object MalformedCustom : EventLabel(Event.TYPE_CUSTOM)
}
