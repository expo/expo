package expo.modules.filesystem.next

import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.Either
import java.io.File
import java.io.FileOutputStream

@OptIn(EitherType::class)
class FileSystemNextFile(file: File) : FileSystemNextPath(file) {
  fun validatePath() {
    // Kept empty for now, but can be used to validate if the path is a valid file path.
  }

  fun create() {
    path.createNewFile()
  }

  fun write(content: Either<String, TypedArray>) {
    if (!exists()) {
      create()
    }
    content.get(String::class).let { text ->
//     TODO: Maybe it be better to use: appContext?.reactContext?.applicationContext?.contentResolver?.openOutputStream
      FileOutputStream(path).use {
        it.write(text.toByteArray())
      }
    }
  }

  fun text(): String {
    return path.readText()
  }
}
