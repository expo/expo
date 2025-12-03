package expo.modules.contacts.next.observers

import android.os.Handler
import android.os.HandlerThread
import android.provider.ContactsContract
import expo.modules.contacts.next.ContactsNextModule
import expo.modules.contacts.next.ContactsObserverException
import expo.modules.contacts.next.ContentResolverNotObtainedException
import expo.modules.kotlin.AppContext
import java.lang.ref.WeakReference

class ContactsObserverDelegate(appContext: AppContext, module: ContactsNextModule) {
  companion object {
    const val ON_CONTACTS_CHANGE_EVENT_NAME = "onContactsChange"
  }

  private var contactsHandlerThread: HandlerThread? = null
  private var contactsHandler: Handler? = null
  private var observer: ContactsObserver? = null
  private val weakAppContextRef = WeakReference(appContext)
  private val weakModuleRef = WeakReference(module)

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
      throw ContactsObserverException("The observer thread failed to start")
    }
    contactsHandlerThread = thread
    contactsHandler = Handler(thread.looper)
    observer = ContactsObserver(
      weakModuleRef.get()
        ?: throw ContactsObserverException("The module has not been initialized"),
      contactsHandler
        ?: throw ContactsObserverException("Failed to get the thread handler")
    )
    val urisToObserve = listOf(
      ContactsContract.Contacts.CONTENT_URI,
      ContactsContract.RawContacts.CONTENT_URI
    )

    urisToObserve.forEach { uri ->
      resolver.registerContentObserver(
        uri,
        true,
        observer
          ?: throw ContactsObserverException("Failed to register content observer")
      )
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
