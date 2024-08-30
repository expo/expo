package expo.modules.filesystem.next

import android.net.Uri
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.typedarray.TypedArray
import java.io.File
import java.io.FileOutputStream

@OptIn(EitherType::class)
class FileSystemFile(path: File) : FileSystemPath(path) {
  // Kept empty for now, but can be used to validate if the path is a valid file path. // TODO: Move to the constructor once also moved on iOS
  fun validatePath() {
  }

  // This makes sure that if a file already exists at a location, it is the correct type so that all available operations perform as expected.
  // After calling this function, we can use the `isDirectory` and `isFile` functions safely as they will match the shared class used.
  override fun validateType() {
    if (path.exists() && path.isDirectory) {
      throw InvalidTypeFileException()
    }
  }

  override fun exists(): Boolean {
    return path.isFile
  }

  fun create() {
    validateType()
    path.createNewFile()
  }

  fun write(content: String) {
    validateType()
    if (!exists()) {
      create()
    }
    FileOutputStream(path).use {
      it.write(content.toByteArray())
    }
  }

  fun write(content: TypedArray) {
    validateType()
    if (!exists()) {
      create()
    }
    FileOutputStream(path).use {
      it.write(content.toDirectBuffer().array())
    }
  }

  fun asString(): String? {
    val uriString = Uri.fromFile(path).toString()
    return if (uriString.endsWith("/")) uriString.dropLast(1) else uriString
  }

  fun text(): String {
    validateType()
    return path.readText()
  }
}
