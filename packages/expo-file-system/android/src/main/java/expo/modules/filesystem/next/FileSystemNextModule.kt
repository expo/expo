package expo.modules.filesystem.next

import android.net.Uri
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.Either
import java.io.File
import java.net.URI

class FileSystemNextModule : Module() {

  @OptIn(EitherType::class)
  override fun definition() = ModuleDefinition {
    Name("FileSystemNext")

    Class(FileSystemNextFile::class) {
      Constructor { path: URI ->
        FileSystemNextFile(File(path.path))
      }

      Function("delete") { file: FileSystemNextFile ->
        file.delete()
      }
      Function("validatePath") { file: FileSystemNextFile ->
        file.validatePath()
      }

      Function("create") { file: FileSystemNextFile ->
        file.create()
      }

      Function("write") { file: FileSystemNextFile, content: Either<String, TypedArray> ->
        file.write(content)
      }

      Function("text") { file: FileSystemNextFile ->
        file.text()
      }

      Function("exists") { file: FileSystemNextFile ->
        file.exists()
      }

      Property("path")
        .get { file: FileSystemNextFile -> return@get Uri.fromFile(file.path) }
        .set { file: FileSystemNextFile, newPath: String ->
          file.path = File(URI(newPath).path)
        }
    }

    Class(FileSystemNextDirectory::class) {
      Constructor { path: URI ->
        FileSystemNextDirectory(File(path.path))
      }

      Function("delete") { directory: FileSystemNextDirectory ->
        directory.delete()
      }

      Function("create") { directory: FileSystemNextDirectory ->
        directory.create()
      }

      Function("exists") { directory: FileSystemNextDirectory ->
        directory.exists()
      }

      Function("validatePath") { directory: FileSystemNextDirectory ->
        directory.validatePath()
      }

      Property("path")
        .get { directory: FileSystemNextDirectory -> return@get Uri.fromFile(directory.path) }
        .set { directory: FileSystemNextDirectory, newPath: URI ->
          directory.path = File(newPath.path)
        }
    }
  }
}
