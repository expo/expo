import android.provider.ContactsContract

sealed class EventLabel {
  abstract val type: Int
  abstract val label: String?

  object Anniversary : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_ANNIVERSARY
    override val label = null
  }

  object Birthday : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY
    override val label = null
  }

  object Other : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_OTHER
    override val label = null
  }

  data class Custom(override val label: String) : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_CUSTOM
  }

  object Unknown : EventLabel() {
    override val type = ContactsContract.CommonDataKinds.Event.TYPE_CUSTOM
    override val label = "unknown"
  }
}
