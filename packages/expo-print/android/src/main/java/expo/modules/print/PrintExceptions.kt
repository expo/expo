package expo.modules.print

import expo.modules.kotlin.exception.CodedException

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")

internal class Base64EncodingFailedException(cause: Throwable? = null) :
  CodedException("An error occurred while encoding PDF file to base64 string: ", cause)

internal class GenericPrintException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

internal class CannotLoadUriException(cause: Throwable? = null) :
  CodedException("An error occurred while trying to load given data URI: ", cause)

internal class InvalidUriException :
  CodedException("Given URI is not valid")

internal class NullUriException :
  CodedException("Given URI is null")

internal class PdfWriteException(cause: Throwable? = null) :
  CodedException("An error occured while writing the PDF data", cause)

internal class FileNotFoundException(cause: Throwable? = null) :
  CodedException("Cannot create or open a file", cause)

internal class PrintManagerNotAvailableException :
  CodedException("Cannot find the PrintManager")
