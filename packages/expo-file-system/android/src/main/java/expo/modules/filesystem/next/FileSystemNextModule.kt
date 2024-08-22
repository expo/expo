package expo.modules.filesystem.next

import android.webkit.URLUtil
import expo.modules.kotlin.Promise
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.Either
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URI

class FileSystemNextModule : Module() {

  @OptIn(EitherType::class)
  override fun definition() = ModuleDefinition {
    Name("FileSystemNext")

    AsyncFunction("download") { url: URI, to: FileSystemPath, promise: Promise ->
      try {
        with(url.toURL().openConnection() as HttpURLConnection) {
          if (responseCode !in 200..299) {
            promise.reject(UnableToDownloadException("response has status: $responseCode"))
            return@AsyncFunction
          }

          val destination = if (to is FileSystemDirectory) {
            val contentDisposition = headerFields["Content-Disposition"]?.first()
            val fileName = URLUtil.guessFileName(url.toString(), contentDisposition, contentType)
            File(to.path, fileName)
          } else {
            to.path
          }
          FileOutputStream(destination).use { output ->
            inputStream.copyTo(output)
            promise.resolve(destination.path)
          }
        }
      } catch (e: Exception) {
        promise.reject(UnableToDownloadException(e.message))
        return@AsyncFunction
      }
    }

    Class(FileSystemFile::class) {
      Constructor { path: URI ->
        FileSystemFile(File(path.path))
      }

      Function("delete") { file: FileSystemFile ->
        file.delete()
      }
      Function("validatePath") { file: FileSystemFile ->
        file.validatePath()
      }

      Function("create") { file: FileSystemFile ->
        file.create()
      }

      Function("write") { file: FileSystemFile, content: Either<String, TypedArray> ->
        if (content.`is`(String::class)) {
          content.get(String::class).let {
            file.write(it)
          }
        }
        if (content.`is`(TypedArray::class)) {
          content.get(TypedArray::class).let {
            file.write(it)
          }
        }
      }

      Function("text") { file: FileSystemFile ->
        file.text()
      }

      Function("exists") { file: FileSystemFile ->
        file.exists()
      }

      Function("copy") { file: FileSystemFile, destination: FileSystemPath ->
        file.copy(destination)
      }

      Function("move") { file: FileSystemFile, destination: FileSystemPath ->
        file.move(destination)
      }

      Property("path") { file ->
        file.asString()
      }
    }

    Class(FileSystemDirectory::class) {
      Constructor { path: URI ->
        FileSystemDirectory(File(path.path))
      }

      Function("delete") { directory: FileSystemDirectory ->
        directory.delete()
      }

      Function("create") { directory: FileSystemDirectory ->
        directory.create()
      }

      Function("exists") { directory: FileSystemDirectory ->
        directory.exists()
      }

      Function("validatePath") { directory: FileSystemDirectory ->
        directory.validatePath()
      }

      Function("copy") { directory: FileSystemDirectory, destination: FileSystemPath ->
        directory.copy(destination)
      }

      Function("move") { directory: FileSystemDirectory, destination: FileSystemPath ->
        directory.move(destination)
      }

      Property("path") { directory ->
        directory.asString()
      }
    }
  }
}
