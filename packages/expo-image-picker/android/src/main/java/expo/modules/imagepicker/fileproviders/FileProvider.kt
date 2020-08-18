package expo.modules.imagepicker.fileproviders

import java.io.File
import java.io.IOException

interface FileProvider {
  @Throws(IOException::class)
  fun generateFile(): File
}
