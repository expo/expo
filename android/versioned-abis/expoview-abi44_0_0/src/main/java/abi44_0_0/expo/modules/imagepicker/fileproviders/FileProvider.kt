package abi44_0_0.expo.modules.imagepicker.fileproviders

import java.io.File
import java.io.IOException

interface FileProvider {
  @Throws(IOException::class)
  fun generateFile(): File
}
