package expo.modules.medialibrary.next.extensions

import androidx.core.net.toUri
import expo.modules.medialibrary.next.objects.asset.factories.buildUniqueDisplayName
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

fun File.safeMove(destinationDirectory: File): File =
  safeCopy(destinationDirectory).also {
    delete()
  }

fun File.safeCopy(destinationDirectory: File): File {
  val displayName = buildUniqueDisplayName(this.toUri())
  val newFile = File(destinationDirectory, displayName)
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
