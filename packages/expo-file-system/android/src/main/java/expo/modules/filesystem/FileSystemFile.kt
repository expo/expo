package expo.modules.filesystem

import android.net.Uri
import android.util.Base64
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.typedarray.TypedArray
import java.io.FileOutputStream
import java.security.MessageDigest

@OptIn(EitherType::class)
class FileSystemFile(uri: Uri) : FileSystemPath(uri) {
  // Kept empty for now, but can be used to validate if the uri is a valid file uri. // TODO: Move to the constructor once also moved on iOS
  fun validatePath() {
  }

  // This makes sure that if a file already exists at a location, it is the correct type so that all available operations perform as expected.
  // After calling this function, we can use the `isDirectory` and `isFile` functions safely as they will match the shared class used.
  override fun validateType() {
    validatePermission(Permission.READ)
    if (file.exists() && file.isDirectory()) {
      throw InvalidTypeFileException()
    }
  }

  val exists: Boolean get() {
    return if (checkPermission(Permission.READ)) {
      file.isFile()
    } else {
      false
    }
  }

  fun create(options: CreateOptions = CreateOptions()) {
    validateType()
    validatePermission(Permission.WRITE)
    validateCanCreate(options)
    if (uri.isContentUri) {
      throw UnableToCreateException("create function does not work with SAF Uris, use `createDirectory` and `createFile` instead")
    }
    if (options.overwrite && exists) {
      javaFile.delete()
    }
    if (options.intermediates) {
      javaFile.parentFile?.mkdirs()
    }
    val created = javaFile.createNewFile()
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
    file.outputStream().use { outputStream ->
      outputStream.write(content.toByteArray())
    }
  }

  fun write(content: TypedArray) {
    validateType()
    validatePermission(Permission.WRITE)
    if (!exists) {
      create()
    }
    if (uri.isContentUri) {
      file.outputStream().use { outputStream ->
        val array = ByteArray(content.length)
        content.toDirectBuffer().get(array)
        outputStream.write(array)
      }
    } else {
      FileOutputStream(javaFile).use {
        it.channel.write(content.toDirectBuffer())
      }
    }
  }

  fun asString(): String {
    val uriString = file.uri.toString()
    return if (uriString.endsWith("/")) uriString.dropLast(1) else uriString
  }

  fun text(): String {
    validateType()
    validatePermission(Permission.READ)
    return file.inputStream().use { inputStream ->
      inputStream.bufferedReader().use { it.readText() }
    }
  }

  fun base64(): String {
    validateType()
    validatePermission(Permission.READ)
    file.inputStream().use {
      return Base64.encodeToString(it.readBytes(), Base64.NO_WRAP)
    }
  }

  fun bytes(): ByteArray {
    validateType()
    validatePermission(Permission.READ)
    file.inputStream().use {
      return it.readBytes()
    }
  }

  @OptIn(ExperimentalStdlibApi::class)
  val md5: String get() {
    validatePermission(Permission.READ)
    val md = MessageDigest.getInstance("MD5")
    file.inputStream().use {
      val digest = md.digest(it.readBytes())
      return digest.toHexString()
    }
  }

  val size: Long? get() {
    return if (file.exists()) {
      file.length()
    } else {
      null
    }
  }

  val type: String? get() {
    return file.type
  }

  fun info(options: InfoOptions?): FileInfo {
    validateType()
    validatePermission(Permission.READ)
    if (!file.exists()) {
      val fileInfo = FileInfo(
        exists = false,
        uri = slashifyFilePath(file.uri.toString())
      )
      return fileInfo
    }
    val fileInfo = FileInfo(
      exists = true,
      uri = slashifyFilePath(file.uri.toString()),
      size = size,
      modificationTime = modificationTime,
      creationTime = creationTime
    )
    if (options != null && options.md5 == true) {
      fileInfo.md5 = md5
    }
    return fileInfo
  }
}
