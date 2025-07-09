package expo.modules.videothumbnails

import expo.modules.kotlin.exception.CodedException

class ThumbnailFileException :
  CodedException("Can't read file")

class GenerateThumbnailException :
  CodedException("Could not generate thumbnail")

class FilePermissionsModuleNotFound :
  CodedException("File permissions module not found")

class InvalidSourceFilenameException :
  CodedException("Invalid source URI")
