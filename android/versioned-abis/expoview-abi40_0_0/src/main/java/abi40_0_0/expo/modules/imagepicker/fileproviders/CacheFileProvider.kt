package abi40_0_0.expo.modules.imagepicker.fileproviders

import abi40_0_0.expo.modules.imagepicker.ImagePickerConstants
import abi40_0_0.org.unimodules.core.utilities.FileUtilities
import java.io.File

class CacheFileProvider(private val cacheFolder: File,
                        private val extension: String) : FileProvider {
  override fun generateFile() = File(
    FileUtilities.generateOutputPath(cacheFolder, ImagePickerConstants.CACHE_DIR_NAME, extension)
  )
}
