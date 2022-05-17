package expo.modules.imagepicker

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.DecoratedException
import java.io.File

internal class FailedDeducingTypeException
  : CodedException("Can not deduce type of the returned file")

internal class FailedToCreateFileException(path: String, cause: Throwable)
  : CodedException("Failed to create the file '${path}'", cause)

internal class FailedToExtractVideoMetadataException
  : CodedException("Failed to extract video metadata")

internal class FailedToReadFileException(file: File, cause: Throwable? = null)
  : CodedException("Failed to read a file '${file.absolutePath}'", cause)

internal class FailedToWriteFileException(file: File, cause: Throwable)
  : CodedException("Failed to write a file '${file.absolutePath}'", cause)

internal class MissingActivityToHandleIntent(intentType: String?)
  : CodedException("Failed to resolve activity to handle the intent of type '$intentType'")

internal class MissingCurrentActivityException
  : CodedException("Activity which was provided during module initialization is no longer available")

internal class UnexpectedException(cause: Throwable)
  : DecoratedException("Unexpected exception", cause)

internal class UserRejectedPermissionsException
  : CodedException("User rejected permissions")
