package expo.modules.filesystem.next

import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.typedarray.TypedArray
import java.io.File
import java.io.FileOutputStream

@OptIn(EitherType::class)
class FileSystemFile(file: File) : FileSystemPath(file) {
  fun validatePath() {
    // Kept empty for now, but can be used to validate if the path is a valid file path.
  }

  fun create() {
    path.createNewFile()
  }

  fun write(content: String) {
    if (!exists()) {
      create()
    }
    FileOutputStream(path).use {
      it.write(content.toByteArray())
    }
  }

  fun write(content: TypedArray) {
    if (!exists()) {
      create()
    }
    FileOutputStream(path).use {
      it.write(content.toDirectBuffer().array())
    }
  }

  fun text(): String {
    return path.readText()
  }
}
