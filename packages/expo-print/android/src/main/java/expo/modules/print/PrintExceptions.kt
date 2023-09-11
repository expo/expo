package expo.modules.print

import expo.modules.kotlin.exception.CodedException

internal class Base64EncodingFailedException(cause: Throwable? = null) :
  CodedException("An error occurred while encoding PDF file to base64 string: ", cause)

internal class UnexpectedPrintException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

internal class CannotLoadUriException(uri: String? = "null", cause: Throwable? = null) :
  CodedException("An error occurred while trying to load the following data URI: $uri", cause)

internal class InvalidUriException(uri: String? = "null") :
  CodedException("Given URI: $uri is not valid")

internal class NullUriException :
  CodedException("Given URI is null")

internal class PdfWriteException(cause: Throwable? = null) :
  CodedException("An error occured while writing the PDF data", cause)

internal class FileNotFoundException(cause: Throwable? = null) :
  CodedException("Cannot create or open a file", cause)

internal class PrintManagerNotAvailableException :
  CodedException("Cannot find the PrintManager")
