package expo.modules.calendar.next.exceptions

import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyName
import expo.modules.kotlin.exception.CodedException

class ExtendedPropertyNameNotSyncSafeException(name: String) :
  CodedException(
    "Extended property name `$name` has no visibility prefix, and this event belongs to a Google account. " +
      "Google Calendar's sync adapter keeps only names prefixed `${ExtendedPropertyName.PRIVATE_PREFIX}` or " +
      "`${ExtendedPropertyName.SHARED_PREFIX}`, and drops the rest on the next sync without reporting an error. " +
      "Use `${ExtendedPropertyName.PRIVATE_PREFIX}$name` to keep the value readable by the owning account only, " +
      "or `${ExtendedPropertyName.SHARED_PREFIX}$name` to share it with the guests of the event."
  )

class ExtendedPropertyNameTooLongException(name: String) :
  CodedException(
    "Extended property name `$name` carries more than ${ExtendedPropertyName.MAX_LENGTH_AFTER_PREFIX} characters " +
      "after its prefix, and this event belongs to a Google account. Google Calendar drops a longer name on the " +
      "next sync without reporting an error. Shorten the name, or move what it carries into the value."
  )

class ExtendedPropertyValueTooLongException(name: String) :
  CodedException(
    "The value given for the extended property `$name` is longer than ${ExtendedPropertyName.MAX_VALUE_LENGTH} " +
      "characters, and this event belongs to a Google account. Google Calendar truncates it on the next sync " +
      "without reporting an error. Store something shorter, such as an identifier pointing at your own storage."
  )

class ExtendedPropertyAccountMissingException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)
