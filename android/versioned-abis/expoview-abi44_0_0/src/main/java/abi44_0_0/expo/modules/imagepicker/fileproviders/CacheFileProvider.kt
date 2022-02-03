package abi44_0_0.expo.modules.imagepicker.fileproviders

import abi44_0_0.expo.modules.imagepicker.ImagePickerConstants
import abi44_0_0.expo.modules.core.utilities.FileUtilities
import java.io.File

class CacheFileProvider(
  private val cacheFolder: File,
  private val extension: String
) : FileProvider {
  override fun generateFile() = File(
    FileUtilities.generateOutputPath(cacheFolder, ImagePickerConstants.CACHE_DIR_NAME, extension)
  )
}
