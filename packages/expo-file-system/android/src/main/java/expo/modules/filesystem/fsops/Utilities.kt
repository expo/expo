package expo.modules.filesystem.fsops

import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.kotlin.exception.Exceptions

/**
 * Copy file contents via streams.
 *
 * @param source Source file (must be a file, not directory)
 * @param dest DestinationSpec file (must be a file or not exist)
 * @throws IllegalArgumentException if source is not a file
 */
internal fun copyFileViaStream(
  source: UnifiedFileInterface,
  dest: UnifiedFileInterface
) {
  require(source.isFile()) { "Source must be a file" }

  source.inputStream().use { input ->
    dest.outputStream().use { output ->
      input.copyTo(output)
    }
  }
}

/**
 * Copy directory recursively via streams.
 *
 * @param source Source directory (must be a directory)
 * @param dest DestinationSpec directory (must be a directory)
 * @throws Exceptions.IllegalArgument if source or dest is not a directory
 * @throws Exceptions.IllegalStateException if child creation fails
 */
internal fun copyDirectoryViaStream(
  source: UnifiedFileInterface,
  dest: UnifiedFileInterface
) {
  require(source.isDirectory()) { "Source must be directory" }
  require(dest.isDirectory()) { "Dest must be directory" }

  source.listFilesAsUnified().forEach { child ->
    val childName = child.fileName
      ?: throw Exceptions.IllegalArgument("Child has no file name")

    if (child.isDirectory()) {
      val childDest = dest.createDirectory(childName)
        ?: throw Exceptions.IllegalStateException("Failed to create directory: $childName")
      copyDirectoryViaStream(child, childDest)
    } else {
      val childDest = dest.createFile(child.type ?: "*/*", childName)
        ?: throw Exceptions.IllegalStateException("Failed to create file: $childName")
      copyFileViaStream(child, childDest)
    }
  }
}
