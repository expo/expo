package expo.modules.filesystem.next

import android.os.Build
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.net.URI
import java.nio.file.attribute.BasicFileAttributes
import java.util.EnumSet
import kotlin.io.path.Path
import kotlin.io.path.moveTo
import kotlin.io.path.readAttributes
import kotlin.time.Duration.Companion.milliseconds

abstract class FileSystemPath(public var uri: URI) : SharedObject() {
  val file get() = File(uri)

  fun delete(fileOrDirectory: File = file) {
    if (!fileOrDirectory.exists()) {
      throw UnableToDeleteException("path '${fileOrDirectory.path}' does not exist")
    }
    if (fileOrDirectory.isDirectory) {
      fileOrDirectory.listFiles()?.forEach { child ->
        if (child.isDirectory) {
          // Recursively delete subdirectories
          delete(child)
        } else {
          if (!child.delete()) {
            throw UnableToDeleteException("failed to delete '${child.path}'")
          }
        }
      }
    }
    if (!fileOrDirectory.delete()) {
      throw UnableToDeleteException("failed to delete '${fileOrDirectory.path}'")
    }
  }

  abstract fun validateType()

  fun getMoveOrCopyPath(destination: FileSystemPath): File {
    if (destination is FileSystemDirectory) {
      if (this is FileSystemFile) {
        if (!destination.exists) {
          throw DestinationDoesNotExistException()
        }
        return File(destination.file, file.name)
      }
      // this if FileSystemDirectory
      // we match unix behavior https://askubuntu.com/a/763915
      if (destination.exists) {
        return File(destination.file, file.name)
      }
      if (destination.file.parentFile?.exists() != true) {
        throw DestinationDoesNotExistException()
      }
      return destination.file
    }
    // destination is FileSystemFile
    if (this !is FileSystemFile) {
      throw CopyOrMoveDirectoryToFileException()
    }
    if (destination.file.parentFile?.exists() != true) {
      throw DestinationDoesNotExistException()
    }
    return destination.file
  }

  fun validatePermission(permission: Permission) {
    if (!checkPermission(permission)) {
      throw InvalidPermissionException(permission)
    }
  }

  fun checkPermission(permission: Permission): Boolean {
    val permissions = appContext?.filePermission?.getPathPermissions(appContext?.reactContext, file.path) ?: EnumSet.noneOf(Permission::class.java)
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

    file.copyRecursively(getMoveOrCopyPath(to))
  }

  fun move(to: FileSystemPath) {
    validateType()
    to.validateType()
    validatePermission(Permission.WRITE)
    to.validatePermission(Permission.WRITE)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val destination = getMoveOrCopyPath(to)
      file.toPath().moveTo(destination.toPath())
      uri = destination.toURI()
    } else {
      file.copyTo(getMoveOrCopyPath(to))
      file.delete()
      uri = getMoveOrCopyPath(to).toURI()
    }
  }

  val modificationTime: Long get() {
    validateType()
    return file.lastModified()
  }

  val creationTime: Long? get() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      validateType()
      val attributes = Path(file.path).readAttributes<BasicFileAttributes>()
      return attributes.creationTime().toMillis().milliseconds.inWholeMilliseconds
    } else {
      return null
    }
  }
}
