// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.print

import android.net.Uri
import java.io.File
import java.io.IOException
import java.util.*

object FileUtils {
  // http://stackoverflow.com/a/38858040/1771921
  fun uriFromFile(file: File?): Uri {
    return Uri.fromFile(file)
  }

  @Throws(IOException::class)
  fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
    return dir
  }

  @Throws(IOException::class)
  fun generateOutputPath(internalDirectory: File, dirName: String, extension: String): String {
    val directory = File(internalDirectory.toString() + File.separator + dirName)
    ensureDirExists(directory)
    val filename = UUID.randomUUID().toString()
    return directory.toString() + File.separator + filename + extension
  }
}
