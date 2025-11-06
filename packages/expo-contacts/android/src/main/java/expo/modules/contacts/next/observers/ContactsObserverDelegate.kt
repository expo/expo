package expo.modules.contacts.next.observers

import android.os.Handler
import android.os.HandlerThread
import android.provider.ContactsContract
import expo.modules.contacts.next.ContentResolverNotObtainedException
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import java.lang.ref.WeakReference

class ContactsObserverDelegate(appContext: AppContext, val module: Module) {
  companion object {
    const val ON_CONTACTS_CHANGE_EVENT_NAME = "onContactsChange"
  }

  private var contactsHandlerThread: HandlerThread? = null
  private var contactsHandler: Handler? = null
  private var observer: ContactsObserver? = null
  private val weakAppContextRef = WeakReference(appContext)

  private val resolver = weakAppContextRef.get()
    ?.reactContext
    ?.contentResolver
    ?: throw ContentResolverNotObtainedException()

  fun startObservingContactChanges() {
    if (observer != null) {
      return
    }
    val thread = HandlerThread("ContactsObserverThread")
    thread.start()
    if (!thread.isAlive) {
      throw IllegalStateException("HandlerThread failed to start")
    }
    contactsHandlerThread = thread
    contactsHandler = Handler(thread.looper)
    observer = ContactsObserver(
      module,
      contactsHandler
        ?: throw IllegalStateException("Thread looper is null")
    )
    val urisToObserve = listOf(
      ContactsContract.Contacts.CONTENT_URI,
      ContactsContract.RawContacts.CONTENT_URI
    )

    urisToObserve.forEach { uri ->
      resolver.registerContentObserver(uri, true, observer ?: throw Exception("XD"))
    }
  }

  fun stopObservingContactChanges() {
    observer?.let {
      resolver.unregisterContentObserver(it)
      this@ContactsObserverDelegate.observer = null
    }
    contactsHandler = null
    contactsHandlerThread?.quitSafely()
    contactsHandlerThread = null
  }
}
