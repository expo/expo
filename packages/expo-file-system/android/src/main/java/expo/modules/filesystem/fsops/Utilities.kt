package expo.modules.filesystem.fsops

import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore

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
      input.copyTo(output, bufferSize = 65_536) // 64KB — reduces syscall overhead vs 8KB default
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

/**
 * Copy directory recursively with parallel file copies.
 *
 * Directory structure is created sequentially (parent before child) to maintain
 * ordering guarantees. File data copies are dispatched in parallel on [Dispatchers.IO]
 * with bounded concurrency via [Semaphore].
 *
 * @param source Source directory
 * @param dest Destination directory (must exist)
 * @param copyFile Function to copy a single file. Defaults to [copyFileViaStream].
 *   Callers can pass an NIO-based alternative for local-to-local copies.
 * @param parallelism Maximum number of concurrent file copies
 */
internal suspend fun copyDirectoryParallel(
  source: UnifiedFileInterface,
  dest: UnifiedFileInterface,
  copyFile: (UnifiedFileInterface, UnifiedFileInterface) -> Unit = ::copyFileViaStream,
  parallelism: Int = 4
) = coroutineScope {
  require(source.isDirectory()) { "Source must be directory" }
  require(dest.isDirectory()) { "Dest must be directory" }

  val semaphore = Semaphore(parallelism)

  suspend fun walk(src: UnifiedFileInterface, dst: UnifiedFileInterface) {
    src.listFilesAsUnified().forEach { child ->
      val childName = child.fileName
        ?: throw Exceptions.IllegalArgument("Child has no file name")

      if (child.isDirectory()) {
        val childDest = dst.createDirectory(childName)
          ?: throw Exceptions.IllegalStateException("Failed to create directory: $childName")
        walk(child, childDest) // Sequential — preserves parent-before-child ordering
      } else {
        // Acquire before launching so traversal itself backpressures when the
        // concurrency limit is reached. This keeps active work, queued jobs,
        // and pre-created destination files bounded.
        semaphore.acquire()
        var launched = false
        try {
          val childDest = dst.createFile(child.type ?: "*/*", childName)
            ?: throw Exceptions.IllegalStateException("Failed to create file: $childName")
          launch(Dispatchers.IO) {
            try {
              copyFile(child, childDest)
            } finally {
              semaphore.release()
            }
          }
          launched = true
        } finally {
          if (!launched) {
            semaphore.release()
          }
        }
      }
    }
  }

  walk(source, dest)
}
