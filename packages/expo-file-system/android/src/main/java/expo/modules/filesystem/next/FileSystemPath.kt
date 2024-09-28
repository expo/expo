package expo.modules.filesystem.next

import android.os.Build
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import kotlin.io.path.moveTo

// We use the `File` class to represent a file or a directory in the file system.
// The Path class might be better, but `java.nio.file.Path` class is not available in API 23.
// The URL, URI classes seem like a less suitable choice.
// https://stackoverflow.com/questions/27845223/whats-the-difference-between-a-resource-uri-url-path-and-file-in-java
abstract class FileSystemPath(var file: File) : SharedObject() {
  fun delete() {
    file.delete()
  }

  abstract fun validateType()

  fun getMoveOrCopyPath(destination: FileSystemPath): File {
    if (destination is FileSystemDirectory) {
      if (this is FileSystemFile) {
        if (!destination.exists) {
          throw DestinationDoesNotExistException()
        }
        return File(destination.file, file.name)
      }
      // this if FileSystemDirectory
      // we match unix behavior https://askubuntu.com/a/763915
      if (destination.exists) {
        return File(destination.file, file.name)
      }
      if (destination.file.parentFile?.exists() != true) {
        throw DestinationDoesNotExistException()
      }
      return destination.file
    }
    // destination is FileSystemFile
    if (this !is FileSystemFile) {
      throw CopyOrMoveDirectoryToFileException()
    }
    if (destination.file.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }
    return destination.file
  }

  fun copy(to: FileSystemPath) {
    validateType()
    to.validateType()

    file.copyRecursively(getMoveOrCopyPath(to))
  }

  fun move(to: FileSystemPath) {
    validateType()
    to.validateType()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val destination = getMoveOrCopyPath(to)
      file.toPath().moveTo(destination.toPath())
      file = destination
    } else {
      file.copyTo(getMoveOrCopyPath(to))
      file.delete()
      file = getMoveOrCopyPath(to)
    }
  }
}
