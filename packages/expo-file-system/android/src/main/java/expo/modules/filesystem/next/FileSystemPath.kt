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

  abstract fun exists(): Boolean

  fun copy(to: FileSystemPath) {
    validateType()
    to.validateType()

    // If the destination folder does not exist, we should throw an exception.
    // If the file's parent folder does not exist, we should throw an exception.
    // Does not allow copying a folder to a file.

    if (to is FileSystemDirectory && !to.file.exists()) {
      throw DestinationDoesNotExistException()
    }

    if (to is FileSystemFile && to.file.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }
    // The above guards can be conditional if we want to allow creating the destination folder(s).

    if (this is FileSystemDirectory && to is FileSystemFile) {
      throw CopyFolderToFileException()
    }

    // do the copying
    if (to.file.isDirectory) {
      file.copyRecursively(File(to.file.path, file.name))
    } else {
      file.copyRecursively(to.file)
    }
  }

  fun move(to: FileSystemPath) {
    validateType()
    to.validateType()

    if (to is FileSystemDirectory && !to.file.exists()) {
      throw DestinationDoesNotExistException()
    }

    if (to is FileSystemFile && to.file.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }

    if (this is FileSystemDirectory && to is FileSystemFile) {
      throw MoveFolderToFileException()
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (to is FileSystemDirectory) {
        file.toPath().moveTo(File(to.file.path, file.name).toPath())
      } else {
        file.toPath().moveTo(to.file.toPath())
      }
    } else {
      if (to is FileSystemDirectory) {
        file.copyTo(File(to.file.path, file.name))
      } else {
        file.copyTo(to.file)
      }
      file.delete()
    }
  }
}
