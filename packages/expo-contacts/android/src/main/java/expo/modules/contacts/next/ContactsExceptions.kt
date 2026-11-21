package expo.modules.contacts.next

import android.net.Uri
import expo.modules.kotlin.exception.CodedException

class ContentResolverNotObtainedException(cause: Throwable? = null) :
  CodedException("Could not obtain the content resolver", cause)

class UnableToExtractIdFromUriException(uri: Uri, cause: Throwable? = null) :
  CodedException("Could not extract an ID from an URI: $uri", cause)

class ContactNotFoundException(cause: Throwable? = null) :
  CodedException("Could not find the contact", cause)

class RawContactIdNotFoundException(cause: Throwable? = null) :
  CodedException("Could not find the rawContactId. Try creating a local contact with Contact.create()", cause)

class ContactIdNotFoundException(cause: Throwable? = null) :
  CodedException("Could not find contactId based on rawContactId", cause)

class CouldNotExecuteQueryException(override val message: String?, cause: Throwable? = null) :
  CodedException(message, cause)

class PermissionException(permission: String, cause: Throwable? = null) :
  CodedException("Missing $permission permission", cause)

class ContactsObserverException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class ContactsPickerUnavailableException(cause: Throwable? = null) :
  CodedException(MESSAGE, cause) {
  companion object {
    const val MESSAGE =
      "Could not pick a contact with the requested fields. " +
        "Android 16 and lower can share the requested fields only with the READ_CONTACTS permission. " +
        "Request a single field (phones, emails or addresses), or request the permission first"
  }
}
