package expo.modules.filesystem.next

import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import kotlin.io.path.moveTo

// We use the `File` class to represent a file or a directory in the file system.
// The Path class might be better, but `java.nio.file.Path` class is not available in API 23.
// The URL, URI classes seem like a less suitable choice.
// https://stackoverflow.com/questions/27845223/whats-the-difference-between-a-resource-uri-url-path-and-file-in-java
abstract class FileSystemPath(var path: File) : SharedObject() {
  fun delete() {
    path.delete()
  }

  abstract fun validateType()

  abstract fun exists(): Boolean

  fun copy(to: FileSystemPath) {
    validateType()
    to.validateType()

    // If the destination folder does not exist, we should throw an exception.
    // If the file's parent folder does not exist, we should throw an exception.
    // Does not allow copying a folder to a file.

    if (to is FileSystemDirectory && !to.path.exists()) {
      throw DestinationDoesNotExistException()
    }

    if (to is FileSystemFile && to.path.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }
    // The above guards can be conditional if we want to allow creating the destination folder(s).

    if (this is FileSystemDirectory && to is FileSystemFile) {
      throw CopyFolderToFileException()
    }

    // do the copying
    if (to.path.isDirectory) {
      path.copyRecursively(File(to.path.path, path.name))
    } else {
      path.copyRecursively(to.path)
    }
  }

  fun move(to: FileSystemPath) {
    validateType()
    to.validateType()

    if (to is FileSystemDirectory && !to.path.exists()) {
      throw DestinationDoesNotExistException()
    }

    if (to is FileSystemFile && to.path.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }

    if (this is FileSystemDirectory && to is FileSystemFile) {
      throw MoveFolderToFileException()
    }

    if (to is FileSystemDirectory) {
      path.toPath().moveTo(File(to.path.path, path.name).toPath())
    } else {
      path.toPath().moveTo(to.path.toPath())
    }
  }
}
