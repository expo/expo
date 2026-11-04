package expo.modules.print

import expo.modules.kotlin.exception.CodedException

internal class Base64EncodingFailedException(cause: Throwable? = null) :
  CodedException("An error occurred while encoding PDF file to base64 string: ", cause)

internal class UnexpectedPrintException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

internal class CannotLoadUriException(uri: String? = "null", cause: Throwable? = null) :
  CodedException("An error occurred while trying to load the following data URI: $uri", cause)

internal class InvalidUriException(uri: String) :
  CodedException("Cannot print '$uri' because it is not a supported URI. Use a file://, content://, http:// or https:// URI, or a base64 data URI")

internal class NullUriException :
  CodedException("No data to print. Specify the `uri` or the `html` option")

internal class PdfWriteException(cause: Throwable? = null) :
  CodedException("An error occurred while writing the PDF data", cause)

internal class FileNotFoundException(cause: Throwable? = null) :
  CodedException("Cannot create or open a file", cause)

internal class PrintManagerNotAvailableException :
  CodedException("Cannot find the PrintManager")
