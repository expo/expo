package expo.modules.filesystem.fsops

import android.net.Uri
import expo.modules.filesystem.UnableToCopyException
import expo.modules.filesystem.unifiedfile.JavaFile
import expo.modules.filesystem.unifiedfile.SAFDocumentFile
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.kotlin.exception.Exceptions

/**
 * A validated, ready-to-write destination for copy/move operations.
 * The destination has been:
 * - Path-resolved (e.g., child path created if copying into directory)
 * - Validated (overwrite checked, parent existence verified)
 * - Cleaned up (existing file deleted if overwrite=true)
 *
 * Think of this as a "sink" that's ready to receive data from a source.
 */
sealed class DestinationSink(val spec: DestinationSpec) {
  /**
   * Receives data from the given source and writes it to this destination.
   * Each subclass knows how to receive data appropriate to its backend.
   *
   * @param source The source file/directory to copy from
   * @return The URI of the resulting copied file/directory
   */
  abstract fun receiveFrom(source: UnifiedFileInterface): Uri

  class LocalFile(spec: DestinationSpec, val target: JavaFile) : DestinationSink(spec) {
    override fun receiveFrom(source: UnifiedFileInterface): Uri {
      when {
        source is JavaFile -> source.copyRecursively(target, overwrite = spec.overwrite)
        source.isDirectory() -> {
          target.mkdir()
          copyDirectoryViaStream(source, target)
        }
        else -> copyFileViaStream(source, target)
      }
      return target.uri
    }
  }

  class SAF(spec: DestinationSpec, val target: SAFDocumentFile, val isContainer: Boolean = false) : DestinationSink(spec) {
    override fun receiveFrom(source: UnifiedFileInterface): Uri {
      if (source.isDirectory()) {
        val actualDest = if (isContainer) {
          val dirName = source.fileName
            ?: throw Exceptions.IllegalStateException("Source has no directory name")
          target.createDirectory(dirName)
            ?: throw Exceptions.IllegalStateException("Failed to create directory: $dirName")
        } else {
          target
        }
        copyDirectoryViaStream(source, actualDest)
        return actualDest.uri
      } else {
        val actualDest = if (isContainer) {
          val fileName = source.fileName
            ?: throw Exceptions.IllegalStateException("Source has no file name")
          val mimeType = source.type ?: "*/*"
          target.createFile(mimeType, fileName)
            ?: throw Exceptions.IllegalStateException("Failed to create file: $fileName")
        } else {
          target
        }
        copyFileViaStream(source, actualDest)
        return actualDest.uri
      }
    }
  }

  class ContentResource(spec: DestinationSpec) : DestinationSink(spec) {
    override fun receiveFrom(source: UnifiedFileInterface): Uri {
      throw UnableToCopyException("Cannot copy to read-only destination")
    }
  }

  class Asset(spec: DestinationSpec) : DestinationSink(spec) {
    override fun receiveFrom(source: UnifiedFileInterface): Uri {
      throw UnableToCopyException("Cannot copy to read-only destination")
    }
  }
}
