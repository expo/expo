package expo.modules.imagepicker

import androidx.core.net.toUri
import expo.modules.kotlin.exception.CodedException
import java.io.File

internal class FailedToDeduceTypeException :
  CodedException("Can not deduce type of the returned file")

internal class FailedToCreateFileException(path: String, cause: Throwable? = null) :
  CodedException("Failed to create the file '$path'", cause)

internal class FailedToPickMediaException :
  CodedException("Failed to parse PhotoPicker result")

internal class FailedToExtractVideoMetadataException(file: File? = null, cause: Throwable? = null) :
  CodedException("Failed to extract metadata from video file '${file?.toUri()?.toString() ?: ""}'", cause)

internal class FailedToWriteExifDataToFileException(file: File, cause: Throwable) :
  CodedException("Failed to write EXIF data to file '${file.toUri()}", cause)

internal class FailedToWriteFileException(file: File? = null, cause: Throwable? = null) :
  CodedException("Failed to write a file '${file?.toUri()?.toString() ?: ""}'", cause)

internal class FailedToReadFileException(file: File, cause: Throwable? = null) :
  CodedException("Failed to read a file '${file.toUri()}", cause)

internal class MissingActivityToHandleIntent(intentType: String?) :
  CodedException("Failed to resolve activity to handle the intent of type '$intentType'")

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")

internal class MissingModuleException(moduleName: String) :
  CodedException("Module '$moduleName' not found. Are you sure all modules are linked correctly?")

internal class UserRejectedPermissionsException :
  CodedException("User rejected permissions")
