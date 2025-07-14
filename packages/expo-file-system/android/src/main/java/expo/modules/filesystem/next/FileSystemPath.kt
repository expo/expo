package expo.modules.filesystem.next

import android.net.Uri
import android.os.Build
import androidx.core.net.toUri
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.net.URI
import java.util.EnumSet
import kotlin.io.path.moveTo

abstract class FileSystemPath(var uri: Uri) : SharedObject() {
  val javaFile get() = File(URI.create(uri.toString()))
  val file: FileSystemFileAdapter by lazy {
    FileSystemFileAdapter(appContext?.reactContext ?: throw Exception("No context"), uri)
  }
  val isContentURI = uri.scheme == "content"

  fun delete() {
    if (!file.exists()) {
      throw UnableToDeleteException("uri '${file.uri}' does not exist")
    }
    if (file.isDirectory) {
      file.listFiles().forEach { child ->
        if (child.isDirectory) {
          // Recursively delete subdirectories
          FileSystemFileAdapter(appContext?.reactContext ?: throw Exception("No context"), child.uri).delete()
        } else {
          if (!child.delete()) {
            throw UnableToDeleteException("failed to delete '${child.uri}'")
          }
        }
      }
    }
    if (!file.delete()) {
      throw UnableToDeleteException("failed to delete '${file.uri}'")
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
    if(file.isContentURI) {
      // TODO: Consider adding a check for content URIs (not in legacy FS)
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
}
