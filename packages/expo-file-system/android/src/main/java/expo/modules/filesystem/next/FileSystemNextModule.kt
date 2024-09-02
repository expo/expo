package expo.modules.filesystem.next

import android.webkit.URLUtil
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.devtools.await
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.Either
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.net.URI

class FileSystemNextModule : Module() {

  @OptIn(EitherType::class)
  override fun definition() = ModuleDefinition {
    Name("FileSystemNext")

    AsyncFunction("downloadFileAsync") Coroutine { url: URI, to: FileSystemPath ->
      val request = Request.Builder().url(url.toURL()).build()
      val client = OkHttpClient()
      val response = request.await(client)

      if (!response.isSuccessful) {
        throw UnableToDownloadException("response has status: ${response.code}")
      }

      val contentDisposition = response.headers["content-disposition"]
      val contentType = response.headers["content-type"]
      val fileName = URLUtil.guessFileName(url.toString(), contentDisposition, contentType)

      val destination = if (to is FileSystemDirectory) {
        File(to.path, fileName)
      } else {
        to.path
      }

      val body = response.body ?: throw UnableToDownloadException("response body is null")
      body.byteStream().use { input ->
        FileOutputStream(destination).use { output ->
          input.copyTo(output)
        }
      }
      return@Coroutine destination.path
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
