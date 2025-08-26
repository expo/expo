package expo.modules.medialibrary.next.extensions

import expo.modules.medialibrary.MediaLibraryUtils.getFileNameAndExtension
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

fun File.safeMove(destinationDirectory: File): File =
  safeCopy(destinationDirectory).also {
    delete()
  }

fun File.safeCopy(destinationDirectory: File): File {
  var newFile = File(destinationDirectory, name)
  var suffix = 0
  val (filename, extension) = getFileNameAndExtension(name)
  val suffixLimit = Short.MAX_VALUE.toInt()
  while (newFile.exists()) {
    newFile = File(destinationDirectory, filename + "_" + suffix + extension)
    suffix++
    if (suffix > suffixLimit) {
      throw IOException("File name suffix limit reached ($suffixLimit)")
    }
  }

  FileInputStream(this).channel.use { input ->
    FileOutputStream(newFile).channel.use { output ->
      val transferred = input.transferTo(0, input.size(), output)
      if (transferred != input.size()) {
        newFile.delete()
        throw IOException("Could not save file to $destinationDirectory Not enough space.")
      }
      return newFile
    }
  }
}
