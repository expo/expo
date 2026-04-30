package expo.modules.filesystem

import android.content.Context
import android.net.Uri
import android.os.Build
import android.util.Base64
import androidx.annotation.RequiresApi
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.Either
import kotlinx.coroutines.runBlocking
import java.io.File
import java.net.URI

class FileSystemModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  private val downloadStore = DownloadTaskStore()

  @RequiresApi(Build.VERSION_CODES.O)
  override fun definition() = ModuleDefinition {
    Name("FileSystem")

    Events("downloadProgress")

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

    AsyncFunction("downloadFileAsync") Coroutine { url: URI, to: FileSystemPath, options: DownloadOptions?, downloadUUID: String? ->
      downloadFileWithStore(url, to, options, downloadUUID, downloadStore) { uuid, bytesWritten, totalBytes ->
        sendEvent(
          "downloadProgress",
          mapOf(
            "uuid" to uuid,
            "data" to mapOf(
              "bytesWritten" to bytesWritten,
              "totalBytes" to totalBytes
            )
          )
        )
      }
    }

    Function("cancelDownloadAsync") { downloadUuid: String ->
      downloadStore.cancel(downloadUuid)
    }

    lateinit var filePickerLauncher: AppContextActivityResultLauncher<FilePickerContractOptions, FilePickerContractResult>

    RegisterActivityContracts {
      filePickerLauncher = registerForActivityResult(
        FilePickerContract(this@FileSystemModule)
      )
    }

    AsyncFunction("pickDirectoryAsync") Coroutine { initialUri: Uri? ->
      val result = filePickerLauncher.launch(
        FilePickerContractOptions(initialUri, emptyList(), false, PickerType.DIRECTORY)
      )
      when (result) {
        is FilePickerContractResult.Success -> result.paths.first() as FileSystemDirectory
        is FilePickerContractResult.Cancelled -> throw PickerCancelledException()
      }
    }

    AsyncFunction("pickFileAsync") Coroutine { options: PickFileOptions? ->
      val result = filePickerLauncher.launch(
        FilePickerContractOptions(options?.initialUri, options?.mimeTypes ?: listOf(), options?.multipleFiles ?: false, PickerType.FILE)
      )
      when (result) {
        is FilePickerContractResult.Success ->
          if (options?.multipleFiles == true) {
            result.paths
          } else {
            result.paths.first()
          }
        is FilePickerContractResult.Cancelled -> throw PickerCancelledException()
      }
    }

    Function("info") { url: URI ->
      val file = File(url)
      val permissions = appContext
        .filePermission
        .getPathPermissions(
          appContext.reactContext ?: throw Exceptions.ReactContextLost(),
          file.path
        )
      if (permissions.contains(FilePermissionService.Permission.READ) && file.exists()) {
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

      Function("write") { file: FileSystemFile, content: Either<String, TypedArray>, options: WriteOptions? ->
        val append = options?.append ?: false
        if (content.`is`(String::class)) {
          content.get(String::class).let {
            if (options?.encoding == EncodingType.BASE64) {
              file.write(Base64.decode(it, Base64.DEFAULT), append)
            } else {
              file.write(it, append)
            }
          }
        }
        if (content.`is`(TypedArray::class)) {
          content.get(TypedArray::class).let {
            file.write(it, append)
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

      Property("lastModified") { file: FileSystemFile ->
        file.modificationTime
      }

      Property("creationTime") { file: FileSystemFile ->
        file.creationTime
      }

      AsyncFunction("copy") Coroutine { file: FileSystemFile, destination: FileSystemPath, options: RelocationOptions? ->
        file.copy(destination, options ?: RelocationOptions())
      }

      Function("copySync") { file: FileSystemFile, destination: FileSystemPath, options: RelocationOptions? ->
        runBlocking {
          file.copy(destination, options ?: RelocationOptions())
        }
      }

      AsyncFunction("move") Coroutine { file: FileSystemFile, destination: FileSystemPath, options: RelocationOptions? ->
        file.move(destination, options ?: RelocationOptions())
      }

      Function("moveSync") { file: FileSystemFile, destination: FileSystemPath, options: RelocationOptions? ->
        runBlocking {
          file.move(destination, options ?: RelocationOptions())
        }
      }

      Function("rename") { file: FileSystemFile, newName: String ->
        file.rename(newName)
      }

      Property("uri") { file ->
        file.asString()
      }

      Property("contentUri") { file ->
        file.asContentUri()
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

      Function("open") { file: FileSystemFile, mode: FileMode? ->
        file.openHandle(mode)
      }
    }

    Class(FileSystemFileHandle::class) {
      Constructor { file: FileSystemFile, mode: FileMode? ->
        file.openHandle(mode)
      }
      Function("readBytes") { fileHandle: FileSystemFileHandle, bytes: Long ->
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

      AsyncFunction("copy") Coroutine { directory: FileSystemDirectory, destination: FileSystemPath, options: RelocationOptions? ->
        directory.copy(destination, options ?: RelocationOptions())
      }

      Function("copySync") { directory: FileSystemDirectory, destination: FileSystemPath, options: RelocationOptions? ->
        runBlocking {
          directory.copy(destination, options ?: RelocationOptions())
        }
      }

      AsyncFunction("move") Coroutine { directory: FileSystemDirectory, destination: FileSystemPath, options: RelocationOptions? ->
        directory.move(destination, options ?: RelocationOptions())
      }

      Function("moveSync") { directory: FileSystemDirectory, destination: FileSystemPath, options: RelocationOptions? ->
        runBlocking {
          directory.move(destination, options ?: RelocationOptions())
        }
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

    Class(FileSystemUploadTask::class) {
      Constructor {
        FileSystemUploadTask()
      }

      Events("progress")

      AsyncFunction("start") Coroutine { task: FileSystemUploadTask, url: String, file: FileSystemFile, options: UploadTaskOptions ->
        task.start(url, file, options)
      }

      Function("cancel") { task: FileSystemUploadTask ->
        task.cancel()
      }
    }

    Class(FileSystemDownloadTask::class) {
      Constructor {
        FileSystemDownloadTask()
      }

      Events("progress")

      AsyncFunction("start") Coroutine { task: FileSystemDownloadTask, url: URI, to: FileSystemPath, options: DownloadTaskOptions? ->
        to.validatePermission(FilePermissionService.Permission.WRITE)
        task.start(url, to, options)
      }

      Function("pause") { task: FileSystemDownloadTask ->
        task.pause()
      }

      AsyncFunction("resume") Coroutine { task: FileSystemDownloadTask, url: URI, to: FileSystemPath, resumeData: String, options: DownloadTaskOptions? ->
        to.validatePermission(FilePermissionService.Permission.WRITE)
        task.resume(url, to, resumeData, options)
      }

      Function("cancel") { task: FileSystemDownloadTask ->
        task.cancel()
      }
    }
  }
}
