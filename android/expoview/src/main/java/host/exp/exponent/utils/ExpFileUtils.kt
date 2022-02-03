// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import java.io.File
import java.io.IOException

object ExpFileUtils {
  @Throws(IOException::class)
  fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
    return dir
  }
}
