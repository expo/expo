package expo.modules.filesystem

import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import androidx.core.content.FileProvider
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
import java.io.IOException
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
      // Content URIs served by this app's own FileProviders map back onto the internal files and
      // cache trees. In Expo Go those trees hold every experience's sandbox, and an in-process
      // caller reaches any provider regardless of android:exported, so the file the provider would
      // serve has to clear the same check as the equivalent file:// path. Every other content URI
      // keeps the previous behaviour.
      val internalFile = try {
        internalFileServedByOwnProvider()
      } catch (e: IOException) {
        // The authority is ours but the path would not canonicalize. Fail closed: we cannot tell
        // which file this URI serves, and every foreign provider has already returned above.
        return false
      } ?: return true
      return checkPermissionForPath(internalFile.path, permission)
    }
    if (uri.isAssetUri) {
      // TODO: Consider adding a check for asset URIs – this returns asset files of Expo Go (such as root-cert), but these are already freely available on apk mirrors etc.
      return true
    }
    return checkPermissionForPath(javaFile.path, permission)
  }

  /**
   * The file one of this app's own FileProviders would serve for [uri], or null when the URI is not
   * served by this app or does not resolve under the internal files/cache trees.
   *
   * The candidate is verified by asking FileProvider to map it back to a URI. A provider serves a
   * file under the most specific root it has configured, so a matching first path segment proves the
   * candidate is the file this URI resolves to. Going through FileProvider avoids hardcoding
   * authorities or root names, which differ between the providers this app ships.
   */
  private fun internalFileServedByOwnProvider(): File? {
    val context = appContext?.reactContext ?: return null
    // ContentResolver drops a "<userId>@" prefix before it looks the provider up, but
    // PackageManager does not. Strip it here too, otherwise "content://0@<own authority>/..."
    // looks like a foreign provider while still being served by ours.
    val authority = uri.authority?.substringAfterLast('@') ?: return null
    val provider = context.packageManager.resolveContentProvider(authority, 0) ?: return null
    if (provider.packageName != context.packageName) {
      return null
    }

    val segments = uri.pathSegments
    if (segments.size < 2) {
      return null
    }
    val rootName = segments.first()
    val relativePath = segments.drop(1).joinToString("/")

    return listOf(context.filesDir, context.cacheDir)
      .asSequence()
      .map { root -> root to File(root, relativePath).canonicalFile }
      .filter { (root, candidate) -> candidate.path.startsWith(root.canonicalPath + "/") }
      .firstOrNull { (_, candidate) -> servesSamePath(authority, candidate, rootName, context) }
      ?.second
  }

  private fun servesSamePath(
    authority: String,
    candidate: File,
    rootName: String,
    context: Context
  ): Boolean {
    val servedUri = try {
      FileProvider.getUriForFile(context, authority, candidate)
    } catch (e: IllegalArgumentException) {
      // The candidate is outside every root this provider serves.
      return false
    }
    return servedUri.pathSegments.firstOrNull() == rootName
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
    val renamedUri = Uri.parse(parentUri).buildUpon().appendPath(newName).build().toString()
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
