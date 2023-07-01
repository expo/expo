package abi49_0_0.expo.modules.videothumbnails

import abi49_0_0.expo.modules.kotlin.exception.CodedException

class ThumbnailFileException :
  CodedException("Can't read file")

class GenerateThumbnailException :
  CodedException("Could not generate thumbnail")

class FilePermissionsModuleNotFound :
  CodedException("File permissions module not found")
