package expo.modules.medialibrary.next.exceptions

import expo.modules.kotlin.exception.CodedException

class ContentResolverNotObtainedException(cause: Throwable? = null) :
  CodedException("Could not obtain the content resolver", cause)
