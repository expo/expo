package expo.modules.clipboard

import expo.modules.kotlin.exception.CodedException

internal class ClipboardUnavailableException :
  CodedException("'CLIPBOARD_SERVICE' is unavailable on this device", null)

internal class NoPermissionException(cause: SecurityException?) :
  CodedException("App has no permission to read this clipboard item", cause)

internal class PasteFailureException(cause: Throwable?, kind: String = "item") :
  CodedException("Failed to get $kind from clipboard", cause)

internal class CopyFailureException(cause: Throwable?, kind: String = "item") :
  CodedException("Failed to save $kind into clipboard", cause)

internal class InvalidImageException(image: String, cause: Throwable?) :
  CodedException(
    "Invalid base64 image: ${
    image.run { substring(0, minOf(length, 32)) + if (length > 32) "..." else ""}
    }",
    cause
  )
