package abi42_0_0.expo.modules.imagepicker.fileproviders

import abi42_0_0.expo.modules.imagepicker.ImagePickerConstants
import abi42_0_0.org.unimodules.core.utilities.FileUtilities
import java.io.File

class CacheFileProvider(
  private val cacheFolder: File,
  private val extension: String
) : FileProvider {
  override fun generateFile() = File(
    FileUtilities.generateOutputPath(cacheFolder, ImagePickerConstants.CACHE_DIR_NAME, extension)
  )
}
