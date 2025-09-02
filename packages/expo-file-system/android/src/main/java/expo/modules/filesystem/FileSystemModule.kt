package expo.modules.filesystem

import android.content.Context
import android.net.Uri
import android.webkit.URLUtil
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
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
import java.util.EnumSet

class FileSystemModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  @OptIn(EitherType::class)
  override fun definition() = ModuleDefinition {
    Name("FileSystem")

    Constant("documentDirectory") {
      Uri.fromFile(context.filesDir).toString() + "/"
    }

    Constant("cacheDirectory") {
      Uri.fromFile(context.cacheDir).toString() + "/"
    }

    Constant("bundleDirectory") {
      "asset://"
    }

    Property("totalDiskSpace") {
      File(context.filesDir.path).totalSpace
    }

    Property("availableDiskSpace") {
      File(context.filesDir.path).freeSpace
    }

    AsyncFunction("downloadFileAsync") Coroutine { url: URI, to: FileSystemPath, options: DownloadOptions? ->
      to.validatePermission(Permission.WRITE)
      val requestBuilder = Request.Builder().url(url.toURL())

      options?.headers?.forEach { (key, value) ->
        requestBuilder.addHeader(key, value)
      }

      val request = requestBuilder.build()
      val client = OkHttpClient()
      val response = request.await(client)

      if (!response.isSuccessful) {
        throw UnableToDownloadException("response has status: ${response.code}")
      }

      val contentDisposition = response.headers["content-disposition"]
      val contentType = response.headers["content-type"]
      val fileName = URLUtil.guessFileName(url.toString(), contentDisposition, contentType)

      val destination = if (to is FileSystemDirectory) {
        File(to.javaFile, fileName)
      } else {
        to.javaFile
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
      return@Coroutine destination.toURI()
    }

    lateinit var filePickerLauncher: AppContextActivityResultLauncher<FilePickerContractOptions, FilePickerContractResult>

    RegisterActivityContracts {
      filePickerLauncher = registerForActivityResult(
        FilePickerContract(this@FileSystemModule)
      )
    }

    AsyncFunction("pickDirectoryAsync") Coroutine { initialUri: Uri? ->
      val result = filePickerLauncher.launch(FilePickerContractOptions(initialUri, null, PickerType.DIRECTORY))
      when (result) {
        is FilePickerContractResult.Success -> result.path as FileSystemDirectory
        is FilePickerContractResult.Cancelled -> throw PickerCancelledException()
      }
    }

    AsyncFunction("pickFileAsync") Coroutine { initialUri: Uri?, mimeType: String? ->
      val result = filePickerLauncher.launch(FilePickerContractOptions(initialUri, mimeType, PickerType.FILE))
      when (result) {
        is FilePickerContractResult.Success -> result.path as FileSystemFile
        is FilePickerContractResult.Cancelled -> throw PickerCancelledException()
      }
    }

    Function("info") { url: URI ->
      val file = File(url)
      val permissions = appContext.filePermission?.getPathPermissions(appContext.reactContext, file.path)
        ?: EnumSet.noneOf(Permission::class.java)
      if (permissions.contains(Permission.READ) && file.exists()) {
        PathInfo(exists = file.exists(), isDirectory = file.isDirectory)
      } else {
        PathInfo(exists = false, isDirectory = null)
      }
    }

    Class(FileSystemFile::class) {
      Constructor { uri: Uri ->
        FileSystemFile(uri)
      }

      Function("delete") { file: FileSystemFile ->
        file.delete()
      }
      Function("validatePath") { file: FileSystemFile ->
        file.validatePath()
      }

      Function("create") { file: FileSystemFile, options: CreateOptions? ->
        file.create(options ?: CreateOptions())
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

      AsyncFunction("text") { file: FileSystemFile ->
        file.text()
      }

      Function("textSync") { file: FileSystemFile ->
        file.text()
      }

      AsyncFunction("base64") { file: FileSystemFile ->
        file.base64()
      }

      Function("base64Sync") { file: FileSystemFile ->
        file.base64()
      }

      AsyncFunction("bytes") { file: FileSystemFile ->
        file.bytes()
      }

      Function("bytesSync") { file: FileSystemFile ->
        file.bytes()
      }

      Function("info") { file: FileSystemFile, options: InfoOptions? ->
        file.info(options)
      }

      Property("exists") { file: FileSystemFile ->
        file.exists
      }

      Property("modificationTime") { file: FileSystemFile ->
        file.modificationTime
      }

      Property("creationTime") { file: FileSystemFile ->
        file.creationTime
      }

      Function("copy") { file: FileSystemFile, destination: FileSystemPath ->
        file.copy(destination)
      }

      Function("move") { file: FileSystemFile, destination: FileSystemPath ->
        file.move(destination)
      }

      Function("rename") { file: FileSystemFile, newName: String ->
        file.rename(newName)
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

      Property("type") { file ->
        file.type
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
      Constructor { uri: Uri ->
        FileSystemDirectory(uri)
      }

      Function("info") { directory: FileSystemDirectory ->
        directory.info()
      }

      Function("delete") { directory: FileSystemDirectory ->
        directory.delete()
      }

      Function("create") { directory: FileSystemDirectory, options: CreateOptions? ->
        directory.create(options ?: CreateOptions())
      }

      Function("createDirectory") { file: FileSystemDirectory, name: String ->
        return@Function file.createDirectory(name)
      }

      Function("createFile") { file: FileSystemDirectory, name: String, mimeType: String? ->
        return@Function file.createFile(mimeType, name)
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

      Function("rename") { directory: FileSystemDirectory, newName: String ->
        directory.rename(newName)
      }

      Property("uri") { directory ->
        directory.asString()
      }

      Property("size") { directory ->
        directory.size
      }

      // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
      Function("listAsRecords") { directory: FileSystemDirectory ->
        directory.listAsRecords()
      }
    }
  }
}
