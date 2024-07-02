package expo.modules.filesystem.next

import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File

// We use the `File` class to represent a file or a directory in the file system.
// The Path class might be better, but `java.nio.file.Path` class is not available in API 23.
// The URL, URI classes seem like a less suitable choice.
// https://stackoverflow.com/questions/27845223/whats-the-difference-between-a-resource-uri-url-path-and-file-in-java
open class FileSystemNextPath(var path: File) : SharedObject() {
  fun delete() {
    path.delete()
  }

  fun exists(): Boolean {
    return path.exists()
  }
}
