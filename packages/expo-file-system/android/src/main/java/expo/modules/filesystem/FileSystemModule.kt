package expo.modules.filesystem

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.webkit.URLUtil
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.Promise
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

const val PICKER_REQUEST_DIRECTORY = 5395
const val PICKER_REQUEST_FILE = 5396

class FileSystemModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  @SuppressLint("WrongConstant")
  @OptIn(EitherType::class)
  override fun definition() = ModuleDefinition {
    Name("FileSystem")

    Constants(
      "documentDirectory" to Uri.fromFile(context.filesDir).toString() + "/",
      "cacheDirectory" to Uri.fromFile(context.cacheDir).toString() + "/",
      "bundleDirectory" to "asset:///"
    )

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

    var pendingPickerPromise: Promise? = null

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (pendingPickerPromise == null) return@OnActivityResult
      if (requestCode != PICKER_REQUEST_DIRECTORY && requestCode != PICKER_REQUEST_FILE) return@OnActivityResult
      if (resultCode != Activity.RESULT_OK || data == null) {
        pendingPickerPromise?.reject(PickerCancelledException())
        pendingPickerPromise = null
        return@OnActivityResult
      }
      val uri = data.data
      val takeFlags = (
        data.flags
          and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        )
      uri?.let {
        appContext.throwingActivity.contentResolver.takePersistableUriPermission(it, takeFlags)
      }
      when (requestCode) {
        PICKER_REQUEST_DIRECTORY -> {
          pendingPickerPromise?.resolve(
            FileSystemDirectory(uri ?: Uri.EMPTY)
          )
        }

        PICKER_REQUEST_FILE -> {
          pendingPickerPromise?.resolve(
            FileSystemFile(uri ?: Uri.EMPTY)
          )
        }
      }
      pendingPickerPromise = null
    }

    AsyncFunction("pickDirectoryAsync") { initialUri: Uri?, promise: Promise ->
      if (pendingPickerPromise != null) {
        throw FileSystemPendingPickerException()
      }
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
//        intent.addCategory(Intent.CATEGORY_OPENABLE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        initialUri
          .let { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, it) }
      }

      pendingPickerPromise = promise
      appContext.throwingActivity.startActivityForResult(intent, PICKER_REQUEST_DIRECTORY)
    }

    AsyncFunction("pickFileAsync") { initialUri: Uri?, mimeType: String?, promise: Promise ->
      if (pendingPickerPromise != null) {
        throw FileSystemPendingPickerException()
      }
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
//      intent.addCategory(Intent.CATEGORY_OPENABLE)
      // if no type is set no intent handler is found – just android things
      intent.type = mimeType ?: "*/*"
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        initialUri
          .let { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, it) }
      }

      pendingPickerPromise = promise
      appContext.throwingActivity.startActivityForResult(intent, PICKER_REQUEST_FILE)
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
