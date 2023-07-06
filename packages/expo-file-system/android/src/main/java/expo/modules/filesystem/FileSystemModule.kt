package expo.modules.filesystem

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.StatFs
import android.provider.DocumentsContract
import android.util.Base64
import android.util.Log
import androidx.core.content.FileProvider
import androidx.documentfile.provider.DocumentFile
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Headers
import okhttp3.JavaNetCookieJar
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.Response
import okhttp3.ResponseBody
import okio.*
import org.apache.commons.codec.binary.Hex
import org.apache.commons.codec.digest.DigestUtils
import org.apache.commons.io.FileUtils
import org.apache.commons.io.IOUtils
import java.io.BufferedInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.io.OutputStreamWriter
import java.math.BigInteger
import java.net.CookieHandler
import java.net.URLConnection
import java.util.*
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern
import kotlin.math.pow

private val TAG = FileSystemModule::class.java.simpleName
private const val EXDownloadProgressEventName = "expo-file-system.downloadProgress"
private const val EXUploadProgressEventName = "expo-file-system.uploadProgress"
private const val MIN_EVENT_DT_MS: Long = 100
private const val DIR_PERMISSIONS_REQUEST_CODE = 5394

private fun slashifyFilePath(path: String?): String? {
  return if (path == null) {
    null
  } else if (path.startsWith("file:///")) {
    path
  } else {
    // Ensure leading schema with a triple slash
    Pattern.compile("^file:/*").matcher(path).replaceAll("file:///")
  }
}

// The class needs to be 'open', because it's inherited in expoview
open class FileSystemModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()
  private var client: OkHttpClient? = null
  private var dirPermissionsRequest: Promise? = null
  private val taskHandlers: MutableMap<String, TaskHandler> = HashMap()
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)

  @SuppressLint("WrongConstant", "DiscouragedApi")
  override fun definition() = ModuleDefinition {
    Name("ExponentFileSystem")

    Constants(
      "documentDirectory" to Uri.fromFile(context.filesDir).toString() + "/",
      "cacheDirectory" to Uri.fromFile(context.cacheDir).toString() + "/",
      "bundleDirectory" to "asset:///"
    )

    Events(
      EXDownloadProgressEventName,
      EXUploadProgressEventName
    )

    OnCreate {
      try {
        ensureDirExists(context.filesDir)
        ensureDirExists(context.cacheDir)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    AsyncFunction("getInfoAsync") { _uriStr: String, options: InfoOptions ->
      var uriStr = slashifyFilePath(_uriStr)

      val uri = Uri.parse(uriStr)
      var absoluteUri = uri

      if (uri.scheme == "file") {
        uriStr = parseFileUri(uriStr as String)
        absoluteUri = Uri.parse(uriStr)
      }
      ensurePermission(absoluteUri, Permission.READ)

      if (uri.scheme == "file") {
        val file = absoluteUri.toFile()
        if (file.exists()) {
          return@AsyncFunction Bundle().apply {
            putBoolean("exists", true)
            putBoolean("isDirectory", file.isDirectory)
            putString("uri", Uri.fromFile(file).toString())
            putDouble("size", getFileSize(file).toDouble())
            putDouble("modificationTime", 0.001 * file.lastModified())
            options.md5.takeIf { it == true }?.let { putString("md5", md5(file)) }
          }
        } else {
          return@AsyncFunction Bundle().apply {
            putBoolean("exists", false)
            putBoolean("isDirectory", false)
          }
        }
      } else if (uri.scheme == "content" || uri.scheme == "asset" || uri.scheme == null) {
        try {
          val inputStream: InputStream = when (uri.scheme) {
            "content" -> context.contentResolver.openInputStream(uri)
            "asset" -> openAssetInputStream(uri)
            else -> openResourceInputStream(uriStr)
          } ?: throw FileNotFoundException()

          return@AsyncFunction Bundle().apply {
            putBoolean("exists", true)
            putBoolean("isDirectory", false)
            putString("uri", uri.toString())
            // NOTE: `.available()` is supposedly not a reliable source of size info, but it's been
            //       more reliable than querying `OpenableColumns.SIZE` in practice in tests ¯\_(ツ)_/¯
            putDouble("size", inputStream.available().toDouble())
            if (options.md5 == true) {
              val md5bytes = DigestUtils.md5(inputStream)
              putString("md5", String(Hex.encodeHex(md5bytes)))
            }
          }
        } catch (e: FileNotFoundException) {
          return@AsyncFunction Bundle().apply {
            putBoolean("exists", false)
            putBoolean("isDirectory", false)
          }
        }
      }

      throw IOException("Unsupported scheme for location '$uri'.")
    }

    AsyncFunction("readAsStringAsync") { uriStr: String, options: ReadingOptions ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.READ)

      // TODO:Bacon: Add more encoding types to match iOS
      val encoding = options.encoding
      var contents: String?
      if (encoding == EncodingType.BASE64) {
        getInputStream(uri).use { inputStream ->
          contents = if (options.length != null && options.position != null) {
            val buffer = ByteArray(options.length)
            inputStream.skip(options.position.toLong())
            val bytesRead = inputStream.read(buffer, 0, options.length)
            Base64.encodeToString(buffer, 0, bytesRead, Base64.NO_WRAP)
          } else {
            val inputData = getInputStreamBytes(inputStream)
            Base64.encodeToString(inputData, Base64.NO_WRAP)
          }
        }
      } else {
        contents = when {
          uri.scheme == "file" -> IOUtils.toString(FileInputStream(uri.toFile()))
          uri.scheme == "asset" -> IOUtils.toString(openAssetInputStream(uri))
          uri.scheme == null -> IOUtils.toString(openResourceInputStream(uriStr))
          uri.isSAFUri -> IOUtils.toString(context.contentResolver.openInputStream(uri))
          else -> throw IOException("Unsupported scheme for location '$uri'.")
        }
      }
      return@AsyncFunction contents
    }

    AsyncFunction("writeAsStringAsync") { uriStr: String, contents: String, options: WritingOptions ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      val encoding = options.encoding
      getOutputStream(uri).use { out ->
        if (encoding == EncodingType.BASE64) {
          val bytes = Base64.decode(contents, Base64.DEFAULT)
          out.write(bytes)
        } else {
          OutputStreamWriter(out).use { writer -> writer.write(contents) }
        }
      }
    }

    AsyncFunction("deleteAsync") { uriStr: String, options: DeletingOptions ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      val appendedUri = Uri.withAppendedPath(uri, "..")
      ensurePermission(appendedUri, Permission.WRITE, "Location '$uri' isn't deletable.")

      if (uri.scheme == "file") {
        val file = uri.toFile()
        if (file.exists()) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            FileUtils.forceDelete(file)
          } else {
            // to be removed once Android SDK 25 support is dropped
            forceDelete(file)
          }
          return@AsyncFunction
        } else {
          if (options.idempotent) {
            return@AsyncFunction
          } else {
            throw FileSystemFileNotFoundException(uri)
          }
        }
      } else if (uri.isSAFUri) {
        val file = getNearestSAFFile(uri)
        if (file != null && file.exists()) {
          file.delete()
          return@AsyncFunction
        } else {
          if (options.idempotent) {
            return@AsyncFunction
          } else {
            throw FileSystemFileNotFoundException(uri)
          }
        }
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    }

    AsyncFunction("moveAsync") { options: RelocatingOptions ->
      val fromUri = Uri.parse(slashifyFilePath(options.from))
      ensurePermission(Uri.withAppendedPath(fromUri, ".."), Permission.WRITE, "Location '$fromUri' isn't movable.")
      val toUri = Uri.parse(slashifyFilePath(options.to))
      ensurePermission(toUri, Permission.WRITE)

      if (fromUri.scheme == "file") {
        val from = fromUri.toFile()
        val to = toUri.toFile()
        if (from.renameTo(to)) {
          return@AsyncFunction
        } else {
          throw FileSystemCannotMoveFileException(fromUri, toUri)
        }
      } else if (fromUri.isSAFUri) {
        val documentFile = getNearestSAFFile(fromUri)
        if (documentFile == null || !documentFile.exists()) {
          throw FileSystemCannotMoveFileException(fromUri, toUri)
        }

        val output = toUri.toFile()
        transformFilesFromSAF(documentFile, output, false)
      } else {
        throw IOException("Unsupported scheme for location '$fromUri'.")
      }
    }

    AsyncFunction("copyAsync") { options: RelocatingOptions ->
      val fromUri = Uri.parse(slashifyFilePath(options.from))
      ensurePermission(fromUri, Permission.WRITE, "Location '$fromUri' isn't movable.")
      val toUri = Uri.parse(slashifyFilePath(options.to))
      ensurePermission(toUri, Permission.WRITE)

      when {
        fromUri.scheme == "file" -> {
          val from = fromUri.toFile()
          val to = toUri.toFile()
          if (from.isDirectory) {
            FileUtils.copyDirectory(from, to)
          } else {
            FileUtils.copyFile(from, to)
          }
        }

        fromUri.isSAFUri -> {
          val documentFile = getNearestSAFFile(fromUri)
          if (documentFile == null || !documentFile.exists()) {
            throw FileSystemCopyFailedException(fromUri)
          }
          val output = toUri.toFile()
          transformFilesFromSAF(documentFile, output, true)
        }

        fromUri.scheme == "content" -> {
          val inputStream = context.contentResolver.openInputStream(fromUri)
          val out: OutputStream = FileOutputStream(toUri.toFile())
          IOUtils.copy(inputStream, out)
        }

        fromUri.scheme == "asset" -> {
          val inputStream = openAssetInputStream(fromUri)
          val out: OutputStream = FileOutputStream(toUri.toFile())
          IOUtils.copy(inputStream, out)
        }

        fromUri.scheme == null -> {
          // this is probably an asset embedded by the packager in resources
          val inputStream = openResourceInputStream(options.from)
          val out: OutputStream = FileOutputStream(toUri.toFile())
          IOUtils.copy(inputStream, out)
        }

        else -> {
          throw IOException("Unsupported scheme for location '$fromUri'.")
        }
      }
    }

    AsyncFunction("makeDirectoryAsync") { uriStr: String, options: MakeDirectoryOptions ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      if (uri.scheme == "file") {
        val file = uri.toFile()
        val previouslyCreated = file.isDirectory
        val setIntermediates = options.intermediates
        val success = if (setIntermediates) file.mkdirs() else file.mkdir()
        if (success || setIntermediates && previouslyCreated) {
          return@AsyncFunction
        } else {
          throw FileSystemCannotCreateDirectoryException(uri)
        }
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    }

    AsyncFunction("readDirectoryAsync") { uriStr: String? ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.READ)

      if (uri.scheme == "file") {
        val file = uri.toFile()
        val children = file.listFiles() as Array<File?>?
          ?: throw FileSystemCannotReadDirectoryException(uri)

        return@AsyncFunction children.map { it?.name }
      } else if (uri.isSAFUri) {
        throw FileSystemUnsupportedSchemeException()
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    }

    AsyncFunction("getTotalDiskCapacityAsync") {
      val root = StatFs(Environment.getDataDirectory().absolutePath)
      val blockCount = root.blockCountLong
      val blockSize = root.blockSizeLong
      val capacity = BigInteger.valueOf(blockCount).multiply(BigInteger.valueOf(blockSize))
      // cast down to avoid overflow
      return@AsyncFunction capacity.toDouble().coerceAtMost(2.0.pow(53.0) - 1)
    }

    AsyncFunction("getFreeDiskStorageAsync") {
      val external = StatFs(Environment.getDataDirectory().absolutePath)
      val availableBlocks = external.availableBlocksLong
      val blockSize = external.blockSizeLong
      val storage = BigInteger.valueOf(availableBlocks).multiply(BigInteger.valueOf(blockSize))
      // cast down to avoid overflow
      return@AsyncFunction storage.toDouble().coerceAtMost(2.0.pow(53.0) - 1)
    }

    AsyncFunction("getContentUriAsync") { uri: String ->
      val fileUri = Uri.parse(slashifyFilePath(uri))
      ensurePermission(fileUri, Permission.WRITE)
      ensurePermission(fileUri, Permission.READ)
      fileUri.checkIfFileDirExists()

      if (fileUri.scheme == "file") {
        val file = fileUri.toFile()
        return@AsyncFunction contentUriFromFile(file).toString()
      } else {
        throw FileSystemUnreadableDirectoryException(uri)
      }
    }

    AsyncFunction("readSAFDirectoryAsync") { uriStr: String ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.READ)

      if (uri.isSAFUri) {
        val file = DocumentFile.fromTreeUri(context, uri)
        if (file == null || !file.exists() || !file.isDirectory) {
          throw FileSystemCannotReadDirectoryException(uri)
        }
        val children = file.listFiles()
        return@AsyncFunction children.map { it.uri.toString() }
      } else {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI. Try using FileSystem.readDirectoryAsync instead.")
      }
    }

    AsyncFunction("makeSAFDirectoryAsync") { uriStr: String, dirName: String ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)

      if (!uri.isSAFUri) {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI. Try using FileSystem.makeDirectoryAsync instead.")
      }
      val dir = getNearestSAFFile(uri)
      if (dir != null) {
        if (!dir.isDirectory) {
          throw FileSystemCannotCreateDirectoryException(uri)
        }
      }
      val newDir = dirName.let { dir?.createDirectory(it) }
        ?: throw FileSystemCannotCreateDirectoryException(null)

      return@AsyncFunction newDir.uri.toString()
    }

    AsyncFunction("createSAFFileAsync") { uriStr: String, fileName: String, mimeType: String ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      if (uri.isSAFUri) {
        val dir = getNearestSAFFile(uri)
        if (dir == null || !dir.isDirectory) {
          throw FileSystemCannotCreateFileException(uri)
        }
        val newFile = dir.createFile(mimeType, fileName)
          ?: throw FileSystemCannotCreateFileException(null)

        return@AsyncFunction newFile.uri.toString()
      } else {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI.")
      }
    }

    AsyncFunction("requestDirectoryPermissionsAsync") { initialFileUrl: String?, promise: Promise ->
      val currentActivity = appContext.currentActivity
        ?: throw Exceptions.MissingActivity()
      if (dirPermissionsRequest != null) {
        throw FileSystemPendingPermissionsRequestException()
      }
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        initialFileUrl
          ?.let { Uri.parse(slashifyFilePath(it)) }
          ?.let { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, it) }
      }

      dirPermissionsRequest = promise
      currentActivity.startActivityForResult(intent, DIR_PERMISSIONS_REQUEST_CODE)
    }

    AsyncFunction("uploadAsync") { url: String, fileUriString: String, options: FileSystemUploadOptions, promise: Promise ->
      val request = createUploadRequest(
        url, fileUriString, options
      ) { requestBody -> requestBody }

      okHttpClient?.let {
        it.newCall(request).enqueue(object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            Log.e(TAG, e.message.toString())
            promise.reject(TAG, e.message, e)
          }

          override fun onResponse(call: Call, response: Response) {
            val result = Bundle().apply {
              putString("body", response.body?.string())
              putInt("status", response.code)
              putBundle("headers", translateHeaders(response.headers))
            }
            response.close()
            promise.resolve(result)
          }
        })
      } ?: run {
        promise.reject(FileSystemOkHttpNullException())
      }
    }

    AsyncFunction("uploadTaskStartAsync") { url: String, fileUriString: String, uuid: String, options: FileSystemUploadOptions, promise: Promise ->
      val progressListener: CountingRequestListener = object : CountingRequestListener {
        private var mLastUpdate: Long = -1
        override fun onProgress(bytesWritten: Long, contentLength: Long) {
          val uploadProgress = Bundle()
          val uploadProgressData = Bundle()
          val currentTime = System.currentTimeMillis()

          // Throttle events. Sending too many events will block the JS event loop.
          // Make sure to send the last event when we're at 100%.
          if (currentTime > mLastUpdate + MIN_EVENT_DT_MS || bytesWritten == contentLength) {
            mLastUpdate = currentTime
            uploadProgressData.putDouble("totalBytesSent", bytesWritten.toDouble())
            uploadProgressData.putDouble("totalBytesExpectedToSend", contentLength.toDouble())
            uploadProgress.putString("uuid", uuid)
            uploadProgress.putBundle("data", uploadProgressData)
            sendEvent(EXUploadProgressEventName, uploadProgress)
          }
        }
      }
      val request = createUploadRequest(
        url,
        fileUriString,
        options,
      ) { requestBody -> CountingRequestBody(requestBody, progressListener) }

      val call = okHttpClient!!.newCall(request)
      taskHandlers[uuid] = TaskHandler(call)
      call.enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          if (call.isCanceled()) {
            promise.resolve(null)
            return
          }
          Log.e(TAG, e.message.toString())
          promise.reject(TAG, e.message, e)
        }

        override fun onResponse(call: Call, response: Response) {
          val result = Bundle()
          val body = response.body
          result.apply {
            putString("body", body?.string())
            putInt("status", response.code)
            putBundle("headers", translateHeaders(response.headers))
          }
          response.close()
          promise.resolve(result)
        }
      })
    }

    AsyncFunction("downloadAsync") { url: String, uriStr: String?, options: DownloadOptions, promise: Promise ->
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      uri.checkIfFileDirExists()

      when {
        url.contains(":").not() -> {
          val context = context
          val resources = context.resources
          val packageName = context.packageName
          val resourceId = resources.getIdentifier(url, "raw", packageName)
          val bufferedSource = context.resources.openRawResource(resourceId).source().buffer()
          val file = uri.toFile()
          file.delete()
          val sink = file.sink().buffer()
          sink.writeAll(bufferedSource)
          sink.close()
          val result = Bundle()
          result.putString("uri", Uri.fromFile(file).toString())
          options.md5.takeIf { it }?.let { result.putString("md5", md5(file)) }
          promise.resolve(result)
        }

        "file" == uri.scheme -> {
          val requestBuilder = Request.Builder().url(url)
          if (options.headers != null) {
            val headers = options.headers
            headers.forEach { (key, value) ->
              requestBuilder.addHeader(key, value)
            }
          }
          okHttpClient?.newCall(requestBuilder.build())?.enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
              Log.e(TAG, e.message.toString())
              promise.reject(TAG, e.message, e)
            }

            @Throws(IOException::class)
            override fun onResponse(call: Call, response: Response) {
              val file = uri.toFile()
              file.delete()
              val sink = file.sink().buffer()
              sink.writeAll(response.body!!.source())
              sink.close()
              val result = Bundle().apply {
                putString("uri", Uri.fromFile(file).toString())
                putInt("status", response.code)
                putBundle("headers", translateHeaders(response.headers))
                if (options.md5) {
                  putString("md5", md5(file))
                }
              }
              response.close()
              promise.resolve(result)
            }
          }) ?: promise.reject(FileSystemOkHttpNullException())
        }

        else -> throw IOException("Unsupported scheme for location '$uri'.")
      }
    }

    AsyncFunction("networkTaskCancelAsync") { uuid: String ->
      val taskHandler = taskHandlers[uuid]
      taskHandler?.call?.cancel()
    }

    AsyncFunction("downloadResumableStartAsync") { url: String, fileUriStr: String, uuid: String, options: DownloadOptions, resumeData: String?, promise: Promise ->
      val fileUri = Uri.parse(slashifyFilePath(fileUriStr))
      fileUri.checkIfFileDirExists()
      if (fileUri.scheme != "file") {
        throw IOException("Unsupported scheme for location '$fileUri'.")
      }
      val progressListener: ProgressListener = object : ProgressListener {
        var mLastUpdate: Long = -1
        override fun update(bytesRead: Long, contentLength: Long, done: Boolean) {
          val downloadProgress = Bundle()
          val downloadProgressData = Bundle()
          val totalBytesWritten = bytesRead + (resumeData?.toLong() ?: 0)
          val totalBytesExpectedToWrite = contentLength + (resumeData?.toLong() ?: 0)
          val currentTime = System.currentTimeMillis()

          // Throttle events. Sending too many events will block the JS event loop.
          // Make sure to send the last event when we're at 100%.
          if (currentTime > mLastUpdate + MIN_EVENT_DT_MS || totalBytesWritten == totalBytesExpectedToWrite) {
            mLastUpdate = currentTime
            downloadProgressData.putDouble("totalBytesWritten", totalBytesWritten.toDouble())
            downloadProgressData.putDouble("totalBytesExpectedToWrite", totalBytesExpectedToWrite.toDouble())
            downloadProgress.putString("uuid", uuid)
            downloadProgress.putBundle("data", downloadProgressData)
            sendEvent(EXDownloadProgressEventName, downloadProgress)
          }
        }
      }
      val client = okHttpClient?.newBuilder()
        ?.addNetworkInterceptor { chain ->
          val originalResponse = chain.proceed(chain.request())
          originalResponse.newBuilder()
            .body(ProgressResponseBody(originalResponse.body, progressListener))
            .build()
        }
        ?.build()
      if (client == null) {
        promise.reject(FileSystemOkHttpNullException())
        return@AsyncFunction
      }
      val requestBuilder = Request.Builder()
      resumeData?.let {
        requestBuilder.addHeader("Range", "bytes=$it-")
      }
      if (options.headers != null) {
        val headers = options.headers
        headers.forEach { (key, value) ->
          requestBuilder.addHeader(key, value)
        }
      }

      val request = requestBuilder.url(url).build()
      val call = client.newCall(request)
      taskHandlers[uuid] = DownloadTaskHandler(fileUri, call)
      val params = DownloadResumableTaskParams(
        options, call, fileUri.toFile(), resumeData != null, promise
      )
      moduleCoroutineScope.launch {
        downloadResumableTask(params)
      }
    }

    AsyncFunction("downloadResumablePauseAsync") { uuid: String ->
      val taskHandler = taskHandlers[uuid]
        ?: throw IOException("No download object available")

      if (taskHandler !is DownloadTaskHandler) {
        throw FileSystemCannotFindTaskException()
      }

      taskHandler.call.cancel()
      taskHandlers.remove(uuid)
      val file = taskHandler.fileUri.toFile()
      val result = Bundle().apply {
        putString("resumeData", file.length().toString())
      }
      return@AsyncFunction result
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (requestCode == DIR_PERMISSIONS_REQUEST_CODE && dirPermissionsRequest != null) {
        val currentActivity =
          appContext.currentActivity ?: throw Exceptions.MissingActivity()
        val result = Bundle()
        if (resultCode == Activity.RESULT_OK && data != null) {
          val treeUri = data.data
          val takeFlags = (
            data.flags
              and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            )
          treeUri?.let {
            currentActivity.contentResolver.takePersistableUriPermission(it, takeFlags)
          }
          result.putBoolean("granted", true)
          result.putString("directoryUri", treeUri.toString())
        } else {
          result.putBoolean("granted", false)
        }
        dirPermissionsRequest?.resolve(result)
        dirPermissionsRequest = null
      }
    }

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }
  }

  @Throws(IOException::class)
  private fun Uri.checkIfFileExists() {
    val file = this.toFile()
    if (!file.exists()) {
      throw IOException("Directory for '${file.path}' doesn't exist.")
    }
  }

  @Throws(IOException::class)
  private fun Uri.checkIfFileDirExists() {
    val file = this.toFile()
    val dir = file.parentFile
    if (dir == null || !dir.exists()) {
      throw IOException("Directory for '${file.path}' doesn't exist. Please make sure directory '${file.parent}' exists before calling downloadAsync.")
    }
  }

  @Throws(IOException::class)
  private fun ensureDirExists(dir: File) {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
  }

  private fun permissionsForPath(path: String?): EnumSet<Permission>? {
    return appContext.filePermission?.getPathPermissions(context, path)
  }

  private fun permissionsForUri(uri: Uri) = when {
    uri.isSAFUri -> permissionsForSAFUri(uri)
    uri.scheme == "content" -> EnumSet.of(Permission.READ)
    uri.scheme == "asset" -> EnumSet.of(Permission.READ)
    uri.scheme == "file" -> permissionsForPath(uri.path)
    uri.scheme == null -> EnumSet.of(Permission.READ)
    else -> EnumSet.noneOf(Permission::class.java)
  }

  private fun permissionsForSAFUri(uri: Uri): EnumSet<Permission> {
    val documentFile = getNearestSAFFile(uri)
    return EnumSet.noneOf(Permission::class.java).apply {
      if (documentFile != null) {
        if (documentFile.canRead()) {
          add(Permission.READ)
        }
        if (documentFile.canWrite()) {
          add(Permission.WRITE)
        }
      }
    }
  }

  // For now we only need to ensure one permission at a time, this allows easier error message strings,
  // we can generalize this when needed later
  @Throws(IOException::class)
  private fun ensurePermission(uri: Uri, permission: Permission, errorMsg: String) {
    if (permissionsForUri(uri)?.contains(permission) != true) {
      throw IOException(errorMsg)
    }
  }

  @Throws(IOException::class)
  private fun ensurePermission(uri: Uri, permission: Permission) {
    if (permission == Permission.READ) {
      ensurePermission(uri, permission, "Location '$uri' isn't readable.")
    }
    if (permission == Permission.WRITE) {
      ensurePermission(uri, permission, "Location '$uri' isn't writable.")
    }
    ensurePermission(uri, permission, "Location '$uri' doesn't have permission '${permission.name}'.")
  }

  @Throws(IOException::class)
  private fun openAssetInputStream(uri: Uri): InputStream {
    // AssetManager expects no leading slash.
    val asset = requireNotNull(uri.path).substring(1)
    return context.assets.open(asset)
  }

  @SuppressLint("DiscouragedApi")
  @Throws(IOException::class)
  private fun openResourceInputStream(resourceName: String?): InputStream {
    var resourceId = context.resources.getIdentifier(resourceName, "raw", context.packageName)
    if (resourceId == 0) {
      // this resource doesn't exist in the raw folder, so try drawable
      resourceId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)
      if (resourceId == 0) {
        throw FileNotFoundException("No resource found with the name '$resourceName'")
      }
    }
    return context.resources.openRawResource(resourceId)
  }

  @Throws(IOException::class)
  private fun transformFilesFromSAF(documentFile: DocumentFile, outputDir: File, copy: Boolean) {
    if (!documentFile.exists()) {
      return
    }
    if (!outputDir.exists() && !outputDir.mkdirs()) {
      throw IOException("Couldn't create folder in output dir.")
    }
    if (documentFile.isDirectory) {
      for (file in documentFile.listFiles()) {
        documentFile.name?.let {
          transformFilesFromSAF(file, File(outputDir, it), copy)
        }
      }
      if (!copy) {
        documentFile.delete()
      }
      return
    }
    documentFile.name?.let {
      val newFile = File(outputDir.path, it)
      context.contentResolver.openInputStream(documentFile.uri).use { `in` -> FileOutputStream(newFile).use { out -> IOUtils.copy(`in`, out) } }
      if (!copy) {
        documentFile.delete()
      }
    }
  }

  private fun contentUriFromFile(file: File): Uri {
    val currentActivity = appContext.currentActivity
      ?: throw Exceptions.MissingActivity()

    return FileProvider.getUriForFile(
      currentActivity.application,
      "${currentActivity.application.packageName}.FileSystemFileProvider",
      file
    )
  }

  @Throws(IOException::class)
  private fun createUploadRequest(url: String, fileUriString: String, options: FileSystemUploadOptions, decorator: RequestBodyDecorator): Request {
    val fileUri = Uri.parse(slashifyFilePath(fileUriString))
    ensurePermission(fileUri, Permission.READ)
    fileUri.checkIfFileExists()

    val requestBuilder = Request.Builder().url(url)
    options.headers?.let {
      it.forEach { (key, value) -> requestBuilder.addHeader(key, value) }
    }

    val body = createRequestBody(options, decorator, fileUri.toFile())
    return options.httpMethod.let { requestBuilder.method(it.value, body).build() }
  }

  private fun createRequestBody(options: FileSystemUploadOptions, decorator: RequestBodyDecorator, file: File): RequestBody {
    return when (options.uploadType) {
      FileSystemUploadType.BINARY_CONTENT -> {
        decorator.decorate(file.asRequestBody(null))
      }

      FileSystemUploadType.MULTIPART -> {
        val bodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
        options.parameters?.let {
          (it as Map<String, Any>)
            .forEach { (key, value) -> bodyBuilder.addFormDataPart(key, value.toString()) }
        }
        val mimeType: String = options.mimeType ?: URLConnection.guessContentTypeFromName(file.name)

        val fieldName = options.fieldName ?: file.name
        bodyBuilder.addFormDataPart(fieldName, file.name, decorator.decorate(file.asRequestBody(mimeType.toMediaTypeOrNull())))
        bodyBuilder.build()
      }
    }
  }

  private data class DownloadResumableTaskParams(
    val options: DownloadOptions,
    val call: Call,
    val file: File,
    val isResume: Boolean,
    val promise: Promise
  )

  private suspend fun downloadResumableTask(params: DownloadResumableTaskParams) = withContext(Dispatchers.IO) {
    val (options, call, file, isResume, promise) = params
    try {
      val response = call.execute()
      val responseBody = response.body
      val input = BufferedInputStream(responseBody!!.byteStream())
      val output = FileOutputStream(file, isResume)
      val data = ByteArray(1024)
      var count: Int
      while (input.read(data).also { count = it } != -1) {
        output.write(data, 0, count)
      }
      val result = Bundle().apply {
        putString("uri", Uri.fromFile(file).toString())
        putInt("status", response.code)
        putBundle("headers", translateHeaders(response.headers))
        options.md5.takeIf { it }?.let { putString("md5", md5(file)) }
      }
      response.close()
      promise.resolve(result)
      null
    } catch (e: Exception) {
      if (call.isCanceled()) {
        promise.resolve(null)
        return@withContext null
      }
      e.message?.let { Log.e(TAG, it) }
      promise.reject(TAG, e.message, e)
      null
    }
  }

  private open class TaskHandler(val call: Call)
  private class DownloadTaskHandler(val fileUri: Uri, call: Call) : TaskHandler(call)

  // https://github.com/square/okhttp/blob/master/samples/guide/src/main/java/okhttp3/recipes/Progress.java
  private class ProgressResponseBody constructor(private val responseBody: ResponseBody?, private val progressListener: ProgressListener) : ResponseBody() {
    private var bufferedSource: BufferedSource? = null

    override fun contentType(): MediaType? = responseBody?.contentType()

    override fun contentLength(): Long = responseBody?.contentLength() ?: -1

    override fun source(): BufferedSource =
      bufferedSource ?: source(responseBody!!.source()).buffer()

    private fun source(source: Source): Source {
      return object : ForwardingSource(source) {
        var totalBytesRead = 0L

        @Throws(IOException::class)
        override fun read(sink: Buffer, byteCount: Long): Long {
          val bytesRead = super.read(sink, byteCount)
          // read() returns the number of bytes read, or -1 if this source is exhausted.
          totalBytesRead += if (bytesRead != -1L) bytesRead else 0
          progressListener.update(
            totalBytesRead,
            responseBody?.contentLength()
              ?: -1,
            bytesRead == -1L
          )
          return bytesRead
        }
      }
    }
  }

  internal fun interface ProgressListener {
    fun update(bytesRead: Long, contentLength: Long, done: Boolean)
  }

  @get:Synchronized
  private val okHttpClient: OkHttpClient?
    get() {
      if (client == null) {
        val builder = OkHttpClient.Builder()
          .connectTimeout(60, TimeUnit.SECONDS)
          .readTimeout(60, TimeUnit.SECONDS)
          .writeTimeout(60, TimeUnit.SECONDS)
        val cookieHandler: CookieHandler = appContext.legacyModule()
          ?: throw CookieHandlerNotFoundException()

        builder.cookieJar(JavaNetCookieJar(cookieHandler))
        client = builder.build()
      }
      return client
    }

  @Throws(IOException::class)
  private fun md5(file: File): String {
    val inputStream: InputStream = FileInputStream(file)
    return inputStream.use {
      val md5bytes = DigestUtils.md5(it)
      String(Hex.encodeHex(md5bytes))
    }
  }

  /**
   * Concatenated copy of org.apache.commons.io@1.4.0#FileUtils#forceDelete
   * Newer version of commons-io uses File#toPath() under the hood that unsupported below Android SDK 26
   * See docs for reference https://commons.apache.org/proper/commons-io/javadocs/api-1.4/index.html
   */
  @Throws(IOException::class)
  private fun forceDelete(file: File) {
    if (file.isDirectory) {
      val files = file.listFiles() ?: throw IOException("Failed to list contents of $file")
      var exception: IOException? = null
      for (f in files) {
        try {
          forceDelete(f)
        } catch (ioe: IOException) {
          exception = ioe
        }
      }
      if (null != exception) {
        throw exception
      }
      if (!file.delete()) {
        throw IOException("Unable to delete directory $file.")
      }
    } else if (!file.delete()) {
      throw IOException("Unable to delete file: $file")
    }
  }

  private fun getFileSize(file: File): Long {
    if (!file.isDirectory) {
      return file.length()
    }
    val content = file.listFiles() ?: return 0
    return content.map { getFileSize(it) }.reduceOrNull { total, itemSize -> total + itemSize }
      ?: 0
  }

  @Throws(IOException::class)
  private fun getInputStream(uri: Uri) = when {
    uri.scheme == "file" -> FileInputStream(uri.toFile())
    uri.scheme == "asset" -> openAssetInputStream(uri)
    uri.isSAFUri -> context.contentResolver.openInputStream(uri)!!
    else -> throw IOException("Unsupported scheme for location '$uri'.")
  }

  @Throws(IOException::class)
  private fun getOutputStream(uri: Uri) = when {
    uri.scheme == "file" -> FileOutputStream(uri.toFile())
    uri.isSAFUri -> context.contentResolver.openOutputStream(uri)!!
    else -> throw IOException("Unsupported scheme for location '$uri'.")
  }

  private fun getNearestSAFFile(uri: Uri): DocumentFile? {
    val file = DocumentFile.fromSingleUri(context, uri)
    return if (file != null && file.isFile) {
      file
    } else DocumentFile.fromTreeUri(context, uri)
  }

  // extension functions of Uri class
  private fun Uri.toFile() = if (this.path != null) {
    File(this.path!!)
  } else {
    throw IOException("Invalid Uri: $this")
  }

  private val Uri.isSAFUri: Boolean
    get() = scheme == "content" && host?.startsWith("com.android.externalstorage") ?: false

  private fun parseFileUri(uriStr: String) = uriStr.substring(uriStr.indexOf(':') + 3)

  @Throws(IOException::class)
  private fun getInputStreamBytes(inputStream: InputStream): ByteArray {
    val bytesResult: ByteArray
    val byteBuffer = ByteArrayOutputStream()
    val bufferSize = 1024
    val buffer = ByteArray(bufferSize)
    try {
      var len: Int
      while (inputStream.read(buffer).also { len = it } != -1) {
        byteBuffer.write(buffer, 0, len)
      }
      bytesResult = byteBuffer.toByteArray()
    } finally {
      try {
        byteBuffer.close()
      } catch (ignored: IOException) {
      }
    }
    return bytesResult
  }

  // Copied out of React Native's `NetworkingModule.java`
  private fun translateHeaders(headers: Headers): Bundle {
    val responseHeaders = Bundle()
    for (i in 0 until headers.size) {
      val headerName = headers.name(i)
      // multiple values for the same header
      if (responseHeaders.containsKey(headerName)) {
        responseHeaders.putString(
          headerName,
          responseHeaders.getString(headerName) + ", " + headers.value(i)
        )
      } else {
        responseHeaders.putString(headerName, headers.value(i))
      }
    }
    return responseHeaders
  }
}
