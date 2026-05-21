package expo.modules.filesystem

import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import expo.modules.filesystem.unifiedfile.AssetFile
import expo.modules.filesystem.unifiedfile.ContentProviderFile
import expo.modules.filesystem.fsops.DestinationSpec
import expo.modules.filesystem.unifiedfile.JavaFile
import expo.modules.filesystem.unifiedfile.SAFDocumentFile
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.util.EnumSet
import java.util.regex.Pattern
import kotlin.io.path.moveTo

internal fun validateFileSystemChildName(name: String) {
  val invalid = name.isEmpty() ||
    name == "." ||
    name == ".." ||
    name.any { it == '/' || it == '\\' }
  if (invalid) {
    throw UnableToCreateException("child name must be a single path segment")
  }
}

val Uri.isContentUri
  get(): Boolean {
    return scheme == "content"
  }

val Uri.isAssetUri
  get(): Boolean {
    return scheme == "asset"
  }

fun Uri.isSAFUri(context: Context): Boolean =
  isContentUri && (
    DocumentsContract.isDocumentUri(context, this) || DocumentsContract.isTreeUri(this)
    )

fun slashifyFilePath(path: String?): String? {
  return if (path == null) {
    null
  } else if (path.startsWith("file:///")) {
    path
  } else {
    // Ensure leading schema with a triple slash
    Pattern.compile("^file:/*").matcher(path).replaceAll("file:///")
  }
}

abstract class FileSystemPath(var uri: Uri) : SharedObject() {
  private var fileAdapter: UnifiedFileInterface? = null
  val file: UnifiedFileInterface
    get() {
      val currentAdapter = fileAdapter
      if (currentAdapter?.uri == uri) {
        return currentAdapter
      }

      val context = appContext?.reactContext ?: throw Exceptions.ReactContextLost()
      val newAdapter = when {
        uri.isSAFUri(context) -> SAFDocumentFile(context, uri)
        uri.isContentUri -> ContentProviderFile(context, uri)
        uri.isAssetUri -> AssetFile(context, uri)
        else -> JavaFile(uri)
      }
      return newAdapter.also { fileAdapter = it }
    }

  val javaFile: File
    get() =
      if (uri.isContentUri) {
        throw Exception("This method cannot be used with content URIs: $uri")
      } else {
        (file as File)
      }

  fun delete() {
    validatePermission(FilePermissionService.Permission.WRITE)
    if (!file.exists()) {
      throw UnableToDeleteException("uri '${file.uri}' does not exist")
    }
    if (file.isDirectory()) {
      if (!file.deleteRecursively()) {
        throw UnableToDeleteException("failed to delete '${file.uri}'")
      }
    } else {
      if (!file.delete()) {
        throw UnableToDeleteException("failed to delete '${file.uri}'")
      }
    }
  }

  abstract fun validateType()

  fun getMoveOrCopyPath(destination: FileSystemPath): File {
    if (destination is FileSystemDirectory) {
      if (this is FileSystemFile) {
        if (!destination.exists) {
          throw DestinationDoesNotExistException()
        }
        return File(destination.javaFile, javaFile.name)
      }
      // this if FileSystemDirectory
      // we match unix behavior https://askubuntu.com/a/763915
      if (destination.exists) {
        return File(destination.javaFile, javaFile.name)
      }
      if (destination.javaFile.parentFile?.exists() != true) {
        throw DestinationDoesNotExistException()
      }
      return destination.javaFile
    }
    // destination is FileSystemFile
    if (this !is FileSystemFile) {
      throw CopyOrMoveDirectoryToFileException()
    }
    if (destination.javaFile.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }
    return destination.javaFile
  }

  fun validatePermission(permission: FilePermissionService.Permission) {
    if (!checkPermission(permission)) {
      throw InvalidPermissionException(permission)
    }
  }

  fun checkPermission(permission: FilePermissionService.Permission): Boolean {
    if (uri.isContentUri) {
      // TODO: Consider adding a check for content URIs (not in legacy FS)
      return true
    }
    if (uri.isAssetUri) {
      // TODO: Consider adding a check for asset URIs – this returns asset files of Expo Go (such as root-cert), but these are already freely available on apk mirrors ect.
      return true
    }
    return checkPermissionForPath(javaFile.path, permission)
  }

  private fun checkPermissionForPath(path: String, permission: FilePermissionService.Permission): Boolean {
    val permissions = appContext?.filePermission?.getPathPermissions(
      appContext?.reactContext ?: throw Exceptions.ReactContextLost(), path
    ) ?: EnumSet.noneOf(FilePermissionService.Permission::class.java)
    return permissions.contains(permission)
  }

  fun validateCanCreate(options: CreateOptions) {
    if (!options.overwrite && file.exists()) {
      throw UnableToCreateException("it already exists")
    }
  }

  suspend fun copy(to: FileSystemPath, options: RelocationOptions) {
    validateType()
    to.validateType()
    validatePermission(FilePermissionService.Permission.READ)
    to.validatePermission(FilePermissionService.Permission.WRITE)

    withContext(Dispatchers.IO) {
      file.copyTo(to.asCopyOrMoveDestination(options.overwrite))
    }
  }

  suspend fun move(to: FileSystemPath, options: RelocationOptions) {
    validateType()
    to.validateType()
    validatePermission(FilePermissionService.Permission.WRITE)
    to.validatePermission(FilePermissionService.Permission.WRITE)

    // moveTo returns the URI of where the file was actually moved to
    val finalUri = withContext(Dispatchers.IO) {
      file.moveTo(to.asCopyOrMoveDestination(options.overwrite))
    }

    // Update URI to reflect the new location
    uri = finalUri
  }

  fun rename(newName: String) {
    validateType()
    validatePermission(FilePermissionService.Permission.WRITE)
    validateFileSystemChildName(newName)
    val parent = javaFile.parentFile
      ?: throw UnableToCreateException("parent directory does not exist")
    // Use canonical paths only for containment checks, so symlinks and aliases cannot escape the parent.
    val parentCanonicalPath = parent.canonicalPath
    val newFile = File(parent, newName)
    if (newFile.canonicalFile.parentFile?.canonicalPath != parentCanonicalPath) {
      throw UnableToCreateException("child path escapes parent directory")
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      javaFile.toPath().moveTo(newFile.toPath())
    } else {
      javaFile.copyTo(newFile)
      javaFile.delete()
    }
    uri = renamedUri(newName)
  }

  private fun renamedUri(newName: String): Uri {
    // Preserve the original URI spelling; canonical paths can rewrite /data/user/0 to /data/data.
    val currentUri = uri.toString()
    val currentPath = currentUri.trimEnd('/')
    val parentUri = currentUri.substring(0, currentPath.lastIndexOf('/') + 1)
    val renamedUri = Uri.withAppendedPath(Uri.parse(parentUri), newName).toString()
    return Uri.parse(if (this is FileSystemDirectory) "$renamedUri/" else renamedUri)
  }

  val modificationTime: Long?
    get() {
      validateType()
      return file.lastModified()
    }

  val creationTime: Long?
    get() {
      return file.creationTime
    }
}

fun FileSystemPath.asCopyOrMoveDestination(overwrite: Boolean = false) = DestinationSpec(
  path = file,
  overwrite = overwrite,
  isDirectory = this is FileSystemDirectory
)
