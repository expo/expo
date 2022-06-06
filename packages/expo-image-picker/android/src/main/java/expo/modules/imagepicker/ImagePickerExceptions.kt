package expo.modules.imagepicker

import expo.modules.kotlin.exception.CodedException
import java.io.File

internal class FailedToDeduceTypeException :
  CodedException("Can not deduce type of the returned file")

internal class FailedToCreateFileException :
  CodedException("Failed to create the file")

internal class FailedToExtractVideoMetadataException(cause: Throwable? = null) :
  CodedException("Failed to extract video metadata", cause)

internal class FailedToWriteFileException(file: File? = null, cause: Throwable? = null) :
  CodedException("Failed to write a file '${file?.absolutePath ?: ""}'", cause)

internal class MissingActivityToHandleIntent(intentType: String?) :
  CodedException("Failed to resolve activity to handle the intent of type '$intentType'")

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")

internal class MissingModuleException(moduleName: String) :
  CodedException("Module '$moduleName' not found. Are you sure all modules are linked correctly?")

internal class UserRejectedPermissionsException :
  CodedException("User rejected permissions")

internal class CroppingFailedException(cause: Throwable? = null) :
  CodedException("Cropping operation failed", cause)

internal class FailedToReadDataException :
  CodedException("Reading image data failed")

internal class UnknownException(cause: Throwable) :
  CodedException("Unknown exception", cause)
