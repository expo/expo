package expo.modules.imagepicker.fileproviders

import expo.modules.imagepicker.createOutputFile
import java.io.File

class CacheFileProvider(
  private val cacheFolder: File,
  private val extension: String
) : FileProvider {
  override fun generateFile() = createOutputFile(cacheFolder, extension)
}
