package expo.modules.filesystem.fsops

import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import androidx.core.net.toUri
import expo.modules.filesystem.CopyOrMoveDirectoryToFileException
import expo.modules.filesystem.DestinationAlreadyExistsException
import expo.modules.filesystem.DestinationContainsSourceException
import expo.modules.filesystem.DestinationDoesNotExistException
import expo.modules.filesystem.UnableToMoveException
import expo.modules.filesystem.unifiedfile.AssetFile
import expo.modules.filesystem.unifiedfile.ContentProviderFile
import expo.modules.filesystem.unifiedfile.JavaFile
import expo.modules.filesystem.unifiedfile.SAFDocumentFile
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.kotlin.exception.Exceptions
import java.io.File

/**
 * Strategy pattern for copy/move operations specific to each file backend type.
 *
 * Each file type (LocalFile, SAF, ContentProvider, Asset) has its own strategy
 * that knows how to:
 * - Prepare itself as a destination (validation, path resolution, overwrite handling)
 * - Execute copy/move operations from itself as a source
 * - Optimize operations based on source/destination type combinations
 */
sealed class CopyMoveStrategy(
  protected open val file: UnifiedFileInterface
) {

  open suspend fun copyTo(spec: DestinationSpec) {
    spec.resolve(file).receiveFrom(file)
  }

  open suspend fun moveTo(spec: DestinationSpec): Uri {
    val resolved = spec.resolve(file)
    return tryNativeMove(resolved) ?: run {
      resolved.receiveFrom(file).also {
        if (!file.deleteRecursively()) {
          throw UnableToMoveException("Failed to delete source after move")
        }
      }
    }
  }

  /**
   * Attempts a native (atomic) move for the given resolved destination.
   * Returns the resulting URI if native move succeeded, or null to fall back to copy+delete.
   */
  protected open fun tryNativeMove(resolved: DestinationSink): Uri? = null

  internal abstract fun prepareAsDestination(source: UnifiedFileInterface, spec: DestinationSpec): DestinationSink

  // Implementations

  class LocalFile(override val file: JavaFile) : CopyMoveStrategy(file) {
    override fun prepareAsDestination(source: UnifiedFileInterface, spec: DestinationSpec): DestinationSink {
      val sourceIsDir = source.isDirectory()
      val fileName = source.fileName
        ?: throw IllegalArgumentException("Source has no file name")

      val target: JavaFile = when {
        // Directory → File: error
        sourceIsDir && !spec.isDirectory -> throw CopyOrMoveDirectoryToFileException()
        // Directory → Directory
        sourceIsDir && spec.isDirectory -> {
          if (file.exists()) {
            JavaFile(File(file, fileName).toUri())
          } else {
            if (file.parentFile?.exists() != true) {
              throw DestinationDoesNotExistException()
            }
            file
          }
        }
        // File → Directory
        !sourceIsDir && spec.isDirectory -> {
          if (!file.exists()) {
            throw DestinationDoesNotExistException()
          }
          JavaFile(File(file, fileName).toUri())
        }
        // File → File
        else -> {
          if (file.parentFile?.exists() != true) {
            throw DestinationDoesNotExistException()
          }
          file
        }
      }

      target.takeIf { it.exists() }?.let {
        if (!spec.overwrite) {
          throw DestinationAlreadyExistsException()
        }
        if (source is JavaFile) {
          validateDestinationDoesNotContainSource(source, it)
        }
        it.deleteRecursively()
      }

      return DestinationSink.LocalFile(spec, target)
    }

    // Overwriting deletes the existing destination first. When the destination is the source
    // or one of its ancestors, that delete would remove the source too.
    // Canonical paths resolve symlinks and aliases such as `/data/data` and `/data/user/0`.
    private fun validateDestinationDoesNotContainSource(source: JavaFile, destination: JavaFile) {
      val sourcePath = source.canonicalPath
      val destinationPath = destination.canonicalPath
      if (sourcePath == destinationPath || sourcePath.startsWith(destinationPath + File.separator)) {
        throw DestinationContainsSourceException()
      }
    }

    override fun tryNativeMove(resolved: DestinationSink): Uri? {
      if (resolved !is DestinationSink.LocalFile) {
        return null
      }

      // Fast path: atomic rename (same filesystem)
      if (file.renameTo(resolved.target)) {
        return resolved.target.uri
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return runCatching {
          moveFileNio(file.toPath(), resolved.target.toPath())
          resolved.target.uri
        }.getOrNull()
      }

      return null
    }
  }

  class SAF(
    override val file: SAFDocumentFile,
    private val context: Context
  ) : CopyMoveStrategy(file) {
    override fun prepareAsDestination(source: UnifiedFileInterface, spec: DestinationSpec): DestinationSink {
      val sourceFileName = source.fileName
        ?: throw Exceptions.IllegalArgument("Source ${source.uri} has no file name")

      // → SAF File (not a directory spec)
      if (!spec.isDirectory) {
        if (file.exists()) {
          if (!spec.overwrite) {
            throw DestinationAlreadyExistsException()
          }
          validateDestinationDoesNotContainSource(source, file)
          file.deleteRecursively()
        }
        return DestinationSink.SAF(spec, file, isContainer = false)
      }

      // → SAF Directory that doesn't exist
      if (!file.exists()) {
        if (source.isDirectory()) {
          if (file.parentFile?.exists() != true) {
            throw DestinationDoesNotExistException()
          }
          return DestinationSink.SAF(spec, file, isContainer = false)
        } else {
          throw DestinationDoesNotExistException()
        }
      }

      // → Existing SAF Directory: check child
      file.findFile(sourceFileName)?.let { existingChild ->
        if (!spec.overwrite) {
          throw DestinationAlreadyExistsException()
        }
        validateDestinationDoesNotContainSource(source, existingChild)
        existingChild.deleteRecursively()
      }

      return DestinationSink.SAF(spec, file, isContainer = true)
    }

    // Overwriting deletes the existing target first. When the target is the source
    // or one of its ancestors, that delete would remove the source too.
    // One document can have several URIs (other tree roots, single-document URIs), so documents
    // are compared by document ID.
    private fun validateDestinationDoesNotContainSource(source: UnifiedFileInterface, target: SAFDocumentFile) {
      if (source !is SAFDocumentFile || source.uri.authority != target.uri.authority) {
        return
      }
      val sourceId = source.documentId ?: return
      if (target.documentId == sourceId || (target.isDirectory() && directoryContains(target, source, sourceId))) {
        throw DestinationContainsSourceException()
      }
    }

    // `DocumentsContract.isChildDocument` needs API 29 and a provider root with
    // `FLAG_SUPPORTS_IS_CHILD`. When it is not available, walk the directory instead.
    private fun directoryContains(directory: SAFDocumentFile, source: SAFDocumentFile, sourceId: String): Boolean {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val directoryUri = directory.documentFile?.uri
        val sourceUri = source.documentFile?.uri
        if (directoryUri != null && sourceUri != null) {
          runCatching { DocumentsContract.isChildDocument(context.contentResolver, directoryUri, sourceUri) }
            .getOrNull()
            ?.let { return it }
        }
      }
      return directory.walkTopDown().any { it.documentId == sourceId }
    }

    private val SAFDocumentFile.documentId: String?
      get() = documentFile?.uri?.let { runCatching { DocumentsContract.getDocumentId(it) }.getOrNull() }

    /**
     * Attempts to use native SAF move operation.
     * Only works if both documents are in the same tree.
     *
     * @return the URI of the moved document if successful, null if not supported/failed
     */
    override fun tryNativeMove(resolved: DestinationSink): Uri? {
      if (resolved !is DestinationSink.SAF) {
        return null
      }

      val destination = resolved.target
      val sourceParent = file.documentFile?.parentFile?.uri ?: return null
      val destParent = destination.documentFile?.parentFile?.uri ?: return null

      return runCatching {
        DocumentsContract.moveDocument(
          context.contentResolver,
          file.uri,
          sourceParent,
          destParent
        )
      }.getOrNull()
    }
  }

  class ContentProvider(override val file: ContentProviderFile) : CopyMoveStrategy(file) {
    override fun prepareAsDestination(source: UnifiedFileInterface, spec: DestinationSpec): DestinationSink {
      if (file.exists() && !spec.overwrite) {
        throw DestinationAlreadyExistsException()
      }
      return DestinationSink.ContentResource(spec)
    }

    override suspend fun moveTo(spec: DestinationSpec): Uri {
      throw UnableToMoveException("Content provider file cannot be moved (provider-dependent)")
    }
  }

  class Asset(override val file: AssetFile) : CopyMoveStrategy(file) {
    override fun prepareAsDestination(source: UnifiedFileInterface, spec: DestinationSpec): DestinationSink {
      if (file.exists() && !spec.overwrite) {
        throw DestinationAlreadyExistsException()
      }
      return DestinationSink.Asset(spec)
    }

    override suspend fun moveTo(spec: DestinationSpec): Uri {
      throw UnableToMoveException("Assets cannot be moved (provider-dependent)")
    }
  }
}
