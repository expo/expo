package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import androidx.core.net.toUri
import expo.modules.filesystem.unifiedfile.AssetFile
import expo.modules.filesystem.unifiedfile.JavaFile
import expo.modules.filesystem.unifiedfile.SAFDocumentFile
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.util.EnumSet
import java.util.regex.Pattern
import kotlin.io.path.moveTo

val Uri.isContentUri get(): Boolean {
  return scheme == "content"
}

val Uri.isAssetUri get(): Boolean {
  return scheme == "asset"
}

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
  val file: UnifiedFileInterface get() {
    val currentAdapter = fileAdapter
    if (currentAdapter?.uri == uri) {
      return currentAdapter
    }
    val newAdapter = if (uri.isContentUri) {
      SAFDocumentFile(appContext?.reactContext ?: throw Exception("No context"), uri)
    } else if (uri.isAssetUri) {
      AssetFile(appContext?.reactContext ?: throw Exception("No context"), uri)
    } else {
      JavaFile(uri)
    }
    fileAdapter = newAdapter
    return newAdapter
  }
  val javaFile: File get() =
    if (uri.isContentUri) {
      throw Exception("This method cannot be used with content URIs: $uri")
    } else {
      (file as File)
    }

  fun delete() {
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

  fun validatePermission(permission: Permission) {
    if (!checkPermission(permission)) {
      throw InvalidPermissionException(permission)
    }
  }

  fun checkPermission(permission: Permission): Boolean {
    if (uri.isContentUri) {
      // TODO: Consider adding a check for content URIs (not in legacy FS)
      return true
    }
    if (uri.isAssetUri) {
      // TODO: Consider adding a check for asset URIs – this returns asset files of Expo Go (such as root-cert), but these are already freely available on apk mirrors ect.
      return true
    }
    val permissions = appContext?.filePermission?.getPathPermissions(appContext?.reactContext, javaFile.path) ?: EnumSet.noneOf(Permission::class.java)
    return permissions.contains(permission)
  }

  fun validateCanCreate(options: CreateOptions) {
    if (!options.overwrite && file.exists()) {
      throw UnableToCreateException("it already exists")
    }
  }

  fun copy(to: FileSystemPath) {
    validateType()
    to.validateType()
    validatePermission(Permission.READ)
    to.validatePermission(Permission.WRITE)

    javaFile.copyRecursively(getMoveOrCopyPath(to))
  }

  fun move(to: FileSystemPath) {
    validateType()
    to.validateType()
    validatePermission(Permission.WRITE)
    to.validatePermission(Permission.WRITE)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val destination = getMoveOrCopyPath(to)
      javaFile.toPath().moveTo(destination.toPath())
      uri = destination.toUri()
    } else {
      javaFile.copyTo(getMoveOrCopyPath(to))
      javaFile.delete()
      uri = getMoveOrCopyPath(to).toUri()
    }
  }

  fun rename(newName: String) {
    validateType()
    validatePermission(Permission.WRITE)
    val newFile = File(javaFile.parent, newName)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      javaFile.toPath().moveTo(newFile.toPath())
      uri = newFile.toUri()
    } else {
      javaFile.copyTo(newFile)
      javaFile.delete()
      uri = newFile.toUri()
    }
  }

  val modificationTime: Long? get() {
    validateType()
    return file.lastModified()
  }

  val creationTime: Long? get() {
    return file.creationTime
  }
}
