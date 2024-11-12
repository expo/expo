package expo.modules.filesystem.next

import android.content.Context
import android.net.Uri
import android.webkit.URLUtil
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.devtools.await
import expo.modules.kotlin.exception.Exceptions
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
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  @OptIn(EitherType::class)
  override fun definition() = ModuleDefinition {
    Name("FileSystemNext")

    Constants(
      "documentDirectory" to Uri.fromFile(context.filesDir).toString() + "/",
      "cacheDirectory" to Uri.fromFile(context.cacheDir).toString() + "/",
      "bundleDirectory" to "asset:///"
    )

    AsyncFunction("downloadFileAsync") Coroutine { url: URI, to: FileSystemPath ->
      to.validatePermission(Permission.WRITE)
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
        File(to.file, fileName)
      } else {
        to.file
      }

      if (destination.exists()) {
        throw DestinationAlreadyExistsException()
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
      Constructor { uri: URI ->
        FileSystemFile(File(uri.path))
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

      Function("base64") { file: FileSystemFile ->
        file.base64()
      }

      Property("exists") { file: FileSystemFile ->
        file.exists
      }

      Function("copy") { file: FileSystemFile, destination: FileSystemPath ->
        file.copy(destination)
      }

      Function("move") { file: FileSystemFile, destination: FileSystemPath ->
        file.move(destination)
      }

      Property("uri") { file ->
        file.asString()
      }

      Property("md5") { file ->
        try {
          file.md5
        } catch (e: Exception) {
          null
        }
      }

      Property("size") { file ->
        try {
          file.size
        } catch (e: Exception) {
          null
        }
      }

      Function("open") { file: FileSystemFile ->
        FileSystemFileHandle(file)
      }
    }

    Class(FileSystemFileHandle::class) {
      Constructor { file: FileSystemFile ->
        FileSystemFileHandle(file)
      }
      Function("readBytes") { fileHandle: FileSystemFileHandle, bytes: Int ->
        fileHandle.read(bytes)
      }
      Function("writeBytes") { fileHandle: FileSystemFileHandle, data: ByteArray ->
        fileHandle.write(data)
      }
      Function("close") { fileHandle: FileSystemFileHandle ->
        fileHandle.close()
      }
      Property("offset") { fileHandle: FileSystemFileHandle ->
        fileHandle.offset
      }.set { fileHandle: FileSystemFileHandle, offset: Long ->
        fileHandle.offset = offset
      }
      Property("size") { fileHandle: FileSystemFileHandle ->
        fileHandle.size
      }
    }

    Class(FileSystemDirectory::class) {
      Constructor { uri: URI ->
        FileSystemDirectory(File(uri.path))
      }

      Function("delete") { directory: FileSystemDirectory ->
        directory.delete()
      }

      Function("create") { directory: FileSystemDirectory ->
        directory.create()
      }

      Property("exists") { directory: FileSystemDirectory ->
        directory.exists
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

      Property("uri") { directory ->
        directory.asString()
      }

      // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
      Function("listAsRecords") { directory: FileSystemDirectory ->
        directory.listAsRecords()
      }
    }
  }
}
