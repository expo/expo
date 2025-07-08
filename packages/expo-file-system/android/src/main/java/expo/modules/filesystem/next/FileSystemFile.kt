package expo.modules.filesystem.next

import android.net.Uri
import android.os.Build
import android.util.Base64
import android.webkit.MimeTypeMap
import expo.modules.filesystem.InfoOptions
import expo.modules.filesystem.slashifyFilePath
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.typedarray.TypedArray
import java.io.File
import java.io.FileOutputStream
import java.nio.file.attribute.BasicFileAttributes
import java.security.MessageDigest
import kotlin.io.path.Path
import kotlin.io.path.readAttributes
import kotlin.time.Duration.Companion.milliseconds

@OptIn(EitherType::class)
class FileSystemFile(file: File) : FileSystemPath(file) {
  // Kept empty for now, but can be used to validate if the uri is a valid file uri. // TODO: Move to the constructor once also moved on iOS
  fun validatePath() {
  }

  // This makes sure that if a file already exists at a location, it is the correct type so that all available operations perform as expected.
  // After calling this function, we can use the `isDirectory` and `isFile` functions safely as they will match the shared class used.
  override fun validateType() {
    validatePermission(Permission.READ)
    if (file.exists() && file.isDirectory) {
      throw InvalidTypeFileException()
    }
  }

  val exists: Boolean get() {
    return if (checkPermission(Permission.READ)) {
      file.isFile
    } else {
      false
    }
  }

  fun create(options: CreateOptions = CreateOptions()) {
    validateType()
    validatePermission(Permission.WRITE)
    validateCanCreate(options)
    if (options.overwrite && file.exists()) {
      file.delete()
    }
    if (options.intermediates) {
      file.parentFile?.mkdirs()
    }
    val created = file.createNewFile()
    if (!created) {
      throw UnableToCreateException("file already exists or could not be created")
    }
  }

  fun write(content: String) {
    validateType()
    validatePermission(Permission.WRITE)
    if (!exists) {
      create()
    }
    FileOutputStream(file).use {
      it.write(content.toByteArray())
    }
  }

  fun write(content: TypedArray) {
    validateType()
    validatePermission(Permission.WRITE)
    if (!exists) {
      create()
    }
    FileOutputStream(file).use {
      it.channel.write(content.toDirectBuffer())
    }
  }

  fun asString(): String {
    val uriString = Uri.fromFile(file).toString()
    return if (uriString.endsWith("/")) uriString.dropLast(1) else uriString
  }

  fun text(): String {
    validateType()
    validatePermission(Permission.READ)
    return file.readText()
  }

  fun base64(): String {
    validateType()
    validatePermission(Permission.READ)
    return Base64.encodeToString(file.readBytes(), Base64.NO_WRAP)
  }

  fun bytes(): ByteArray {
    validateType()
    validatePermission(Permission.READ)
    return file.readBytes()
  }

  @OptIn(ExperimentalStdlibApi::class)
  val md5: String get() {
    validatePermission(Permission.READ)
    val md = MessageDigest.getInstance("MD5")
    val digest = md.digest(file.readBytes())
    return digest.toHexString()
  }

  val size: Long? get() {
    return if (file.exists()) {
      file.length()
    } else {
      null
    }
  }

  val type: String? get() {
    return MimeTypeMap.getFileExtensionFromUrl(file.path)
      ?.run { MimeTypeMap.getSingleton().getMimeTypeFromExtension(lowercase()) }
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

  fun info(options: InfoOptions?): FileInfo {
    validateType()
    validatePermission(Permission.READ)
    if (!file.exists()) {
      val fileInfo = FileInfo(
        exists = false,
        uri = slashifyFilePath(file.toURI().toString())
      )
      return fileInfo
    }
    when {
      file.toURI().scheme == "file" -> {
        val fileInfo = FileInfo(
          exists = true,
          uri = slashifyFilePath(file.toURI().toString()),
          size = size,
          modificationTime = modificationTime,
          creationTime = creationTime
        )
        if (options != null && options.md5 == true) {
          fileInfo.md5 = md5
        }
        return fileInfo
      }
      else -> throw UnableToGetInfoException("file schema ${file.toURI().scheme} is not supported")
    }
  }
}
