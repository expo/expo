package expo.modules.calendar.exceptions

import expo.modules.kotlin.exception.CodedException

class EventNotSavedException(message: String = "Event could not be saved", cause: Throwable? = null) :
  CodedException("E_EVENT_NOT_SAVED", message, cause)

class EventNotFoundException(message: String, cause: Throwable? = null) :
  CodedException("E_EVENT_NOT_FOUND", message, cause)

class EventsNotFoundException(message: String = "Events could not be found", cause: Throwable? = null) :
  CodedException("E_EVENTS_NOT_FOUND", message, cause)

class EventNotDeletedException(message: String, cause: Throwable? = null) :
  CodedException("E_EVENT_NOT_DELETED", message, cause)
