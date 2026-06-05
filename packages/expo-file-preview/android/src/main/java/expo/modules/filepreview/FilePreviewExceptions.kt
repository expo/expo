package expo.modules.filepreview

import expo.modules.kotlin.exception.CodedException

internal class FilePreviewInvalidUriException(message: String) :
  CodedException(message)

internal class FilePreviewPermissionException :
  CodedException("You don't have access to the provided file.")

internal class FilePreviewUnsupportedException(mimeType: String) :
  CodedException("No app can preview files of type '$mimeType'.")

internal class FilePreviewFailedException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)
