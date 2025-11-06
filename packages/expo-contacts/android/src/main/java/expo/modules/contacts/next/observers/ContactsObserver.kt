package expo.modules.contacts.next.observers

import android.database.ContentObserver
import android.net.Uri
import android.os.Handler
import expo.modules.contacts.onContactsChangeEventName
import expo.modules.kotlin.modules.Module

class ContactsObserver(val module: Module, handler: Handler) : ContentObserver(handler) {
  override fun onChange(selfChange: Boolean, uri: Uri?) = with(module) {
    super.onChange(selfChange, uri)
    handleContactChange()
  }

  fun Module.handleContactChange() {
    sendEvent(
      onContactsChangeEventName,
      mapOf(
        "body" to null
      )
    )
  }
}
