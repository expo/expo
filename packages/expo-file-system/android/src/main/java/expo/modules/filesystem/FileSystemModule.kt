package expo.modules.filesystem

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.AsyncTask
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.StatFs
import android.provider.DocumentsContract
import android.util.Base64
import android.util.Log

import androidx.core.content.FileProvider
import androidx.documentfile.provider.DocumentFile

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.interfaces.filesystem.Permission

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
import java.lang.ClassCastException
import java.lang.Exception
import java.lang.IllegalArgumentException
import java.lang.NullPointerException
import java.math.BigInteger
import java.net.CookieHandler
import java.net.URLConnection
import java.util.*
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

import kotlin.math.pow

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

private const val NAME = "ExponentFileSystem"
private val TAG = FileSystemModule::class.java.simpleName
private const val EXDownloadProgressEventName = "expo-file-system.downloadProgress"
private const val EXUploadProgressEventName = "expo-file-system.uploadProgress"
private const val MIN_EVENT_DT_MS: Long = 100
private const val HEADER_KEY = "headers"
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
open class FileSystemModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), ActivityEventListener {

  init {
    try {
      ensureDirExists(getContext().filesDir)
      ensureDirExists(getContext().cacheDir)
    } catch (e: IOException) {
      e.printStackTrace()
    }
  }

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val uIManager: UIManager by moduleRegistry()
  private var client: OkHttpClient? = null
  private var dirPermissionsRequest: Promise? = null
  private val taskHandlers: MutableMap<String, TaskHandler> = HashMap()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName() = NAME

  override fun getConstants(): Map<String, Any?> {
    return mapOf(
      "documentDirectory" to Uri.fromFile(context.filesDir).toString() + "/",
      "cacheDirectory" to Uri.fromFile(context.cacheDir).toString() + "/",
      "bundleDirectory" to "asset:///",
    )
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

  private fun permissionsForPath(path: String?): EnumSet<Permission>? {
    val filePermissionModule: FilePermissionModuleInterface by moduleRegistry()
    return filePermissionModule.getPathPermissions(context, path)
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

  @ExpoMethod
  fun getInfoAsync(_uriStr: String, options: Map<String?, Any?>, promise: Promise) {
    var uriStr = slashifyFilePath(_uriStr)
    try {
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
          promise.resolve(
            Bundle().apply {
              putBoolean("exists", true)
              putBoolean("isDirectory", file.isDirectory)
              putString("uri", Uri.fromFile(file).toString())
              putDouble("size", getFileSize(file).toDouble())
              putDouble("modificationTime", 0.001 * file.lastModified())
              options["md5"].takeIf { it == true }?.let { putString("md5", md5(file)) }
            }
          )
        } else {
          promise.resolve(
            Bundle().apply {
              putBoolean("exists", false)
              putBoolean("isDirectory", false)
            }
          )
        }
      } else if (uri.scheme == "content" || uri.scheme == "asset" || uri.scheme == null) {
        try {
          val inputStream: InputStream = when (uri.scheme) {
            "content" -> context.contentResolver.openInputStream(uri)
            "asset" -> openAssetInputStream(uri)
            else -> openResourceInputStream(uriStr)
          } ?: throw FileNotFoundException()
          promise.resolve(
            Bundle().apply {
              putBoolean("exists", true)
              putBoolean("isDirectory", false)
              putString("uri", uri.toString())
              // NOTE: `.available()` is supposedly not a reliable source of size info, but it's been
              //       more reliable than querying `OpenableColumns.SIZE` in practice in tests ¯\_(ツ)_/¯
              putDouble("size", inputStream.available().toDouble())
              if (options.containsKey("md5") && options["md5"] == true) {
                val md5bytes = DigestUtils.md5(inputStream)
                putString("md5", String(Hex.encodeHex(md5bytes)))
              }
            }
          )
        } catch (e: FileNotFoundException) {
          promise.resolve(
            Bundle().apply {
              putBoolean("exists", false)
              putBoolean("isDirectory", false)
            }
          )
        }
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun readAsStringAsync(uriStr: String?, options: Map<String?, Any?>, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.READ)

      // TODO:Bacon: Add more encoding types to match iOS
      val encoding = getEncodingFromOptions(options)
      var contents: String?
      if (encoding.equals("base64", ignoreCase = true)) {
        getInputStream(uri).use { inputStream ->
          contents = if (options.containsKey("length") && options.containsKey("position")) {
            val length = (options["length"] as Number).toInt()
            val position = (options["position"] as Number).toInt()
            val buffer = ByteArray(length)
            inputStream.skip(position.toLong())
            val bytesRead = inputStream.read(buffer, 0, length)
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
      promise.resolve(contents)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun writeAsStringAsync(uriStr: String?, string: String?, options: Map<String?, Any?>, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      val encoding = getEncodingFromOptions(options)
      getOutputStream(uri).use { out ->
        if (encoding == "base64") {
          val bytes = Base64.decode(string, Base64.DEFAULT)
          out.write(bytes)
        } else {
          OutputStreamWriter(out).use { writer -> writer.write(string) }
        }
      }
      promise.resolve(null)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun deleteAsync(uriStr: String?, options: Map<String?, Any?>, promise: Promise) {
    try {
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
          promise.resolve(null)
        } else {
          if (options.containsKey("idempotent") && options["idempotent"] as Boolean) {
            promise.resolve(null)
          } else {
            promise.reject(
              "ERR_FILESYSTEM_CANNOT_FIND_FILE",
              "File '$uri' could not be deleted because it could not be found"
            )
          }
        }
      } else if (uri.isSAFUri) {
        val file = getNearestSAFFile(uri)
        if (file != null && file.exists()) {
          file.delete()
          promise.resolve(null)
        } else {
          if (options.containsKey("idempotent") && options["idempotent"] as Boolean) {
            promise.resolve(null)
          } else {
            promise.reject(
              "ERR_FILESYSTEM_CANNOT_FIND_FILE",
              "File '$uri' could not be deleted because it could not be found"
            )
          }
        }
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun moveAsync(options: Map<String?, Any?>, promise: Promise) {
    try {
      if (!options.containsKey("from")) {
        promise.reject("ERR_FILESYSTEM_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `from` path.")
        return
      }
      val fromUri = Uri.parse(slashifyFilePath(options["from"] as String?))
      ensurePermission(Uri.withAppendedPath(fromUri, ".."), Permission.WRITE, "Location '$fromUri' isn't movable.")
      if (!options.containsKey("to")) {
        promise.reject("ERR_FILESYSTEM_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.")
        return
      }
      val toUri = Uri.parse(slashifyFilePath(options["to"] as String?))
      ensurePermission(toUri, Permission.WRITE)
      if (fromUri.scheme == "file") {
        val from = fromUri.toFile()
        val to = toUri.toFile()
        if (from.renameTo(to)) {
          promise.resolve(null)
        } else {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_MOVE_FILE",
            "File '$fromUri' could not be moved to '$toUri'"
          )
        }
      } else if (fromUri.isSAFUri) {
        val documentFile = getNearestSAFFile(fromUri)
        if (documentFile == null || !documentFile.exists()) {
          promise.reject("ERR_FILESYSTEM_CANNOT_MOVE_FILE", "File '$fromUri' could not be moved to '$toUri'")
          return
        }
        val output = File(toUri.path)
        transformFilesFromSAF(documentFile, output, false)
        promise.resolve(null)
      } else {
        throw IOException("Unsupported scheme for location '$fromUri'.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun copyAsync(options: Map<String?, Any?>, promise: Promise) {
    try {
      if (!options.containsKey("from")) {
        promise.reject("ERR_FILESYSTEM_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `from` path.")
        return
      }
      val fromUri = Uri.parse(slashifyFilePath(options["from"] as String?))
      ensurePermission(fromUri, Permission.READ)
      if (!options.containsKey("to")) {
        promise.reject("ERR_FILESYSTEM_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.")
        return
      }
      val toUri = Uri.parse(slashifyFilePath(options["to"] as String?))
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
          promise.resolve(null)
        }
        fromUri.isSAFUri -> {
          val documentFile = getNearestSAFFile(fromUri)
          if (documentFile == null || !documentFile.exists()) {
            promise.reject("ERR_FILESYSTEM_CANNOT_FIND_FILE", "File '$fromUri' could not be copied because it could not be found")
            return
          }
          val output = File(toUri.path)
          transformFilesFromSAF(documentFile, output, true)
          promise.resolve(null)
        }
        fromUri.scheme == "content" -> {
          val inputStream = context.contentResolver.openInputStream(fromUri)
          val out: OutputStream = FileOutputStream(toUri.toFile())
          IOUtils.copy(inputStream, out)
          promise.resolve(null)
        }
        fromUri.scheme == "asset" -> {
          val inputStream = openAssetInputStream(fromUri)
          val out: OutputStream = FileOutputStream(toUri.toFile())
          IOUtils.copy(inputStream, out)
          promise.resolve(null)
        }
        fromUri.scheme == null -> {
          // this is probably an asset embedded by the packager in resources
          val inputStream = openResourceInputStream(options["from"] as String?)
          val out: OutputStream = FileOutputStream(toUri.toFile())
          IOUtils.copy(inputStream, out)
          promise.resolve(null)
        }
        else -> {
          throw IOException("Unsupported scheme for location '$fromUri'.")
        }
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
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

  @ExpoMethod
  fun makeDirectoryAsync(uriStr: String?, options: Map<String?, Any?>, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      if (uri.scheme == "file") {
        val file = uri.toFile()
        val previouslyCreated = file.isDirectory
        val setIntermediates = options.containsKey("intermediates") && options["intermediates"] as Boolean
        val success = if (setIntermediates) file.mkdirs() else file.mkdir()
        if (success || setIntermediates && previouslyCreated) {
          promise.resolve(null)
        } else {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_CREATE_DIRECTORY",
            "Directory '$uri' could not be created or already exists."
          )
        }
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun readDirectoryAsync(uriStr: String?, options: Map<String?, Any?>?, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.READ)
      if (uri.scheme == "file") {
        val file = uri.toFile()
        val children = file.listFiles()
        if (children != null) {
          val result = children.map { it.name }
          promise.resolve(result)
        } else {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_READ_DIRECTORY",
            "Directory '$uri' could not be read."
          )
        }
      } else if (uri.isSAFUri) {
        promise.reject(
          "ERR_FILESYSTEM_UNSUPPORTED_SCHEME",
          "Can't read Storage Access Framework directory, use StorageAccessFramework.readDirectoryAsync() instead."
        )
      } else {
        throw IOException("Unsupported scheme for location '$uri'.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun getTotalDiskCapacityAsync(promise: Promise) {
    try {
      val root = StatFs(Environment.getDataDirectory().absolutePath)
      val blockCount = root.blockCountLong
      val blockSize = root.blockSizeLong
      val capacity = BigInteger.valueOf(blockCount).multiply(BigInteger.valueOf(blockSize))
      // cast down to avoid overflow
      val capacityDouble = Math.min(capacity.toDouble(), 2.0.pow(53.0) - 1)
      promise.resolve(capacityDouble)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject("ERR_FILESYSTEM_CANNOT_DETERMINE_DISK_CAPACITY", "Unable to access total disk capacity", e)
    }
  }

  @ExpoMethod
  fun getFreeDiskStorageAsync(promise: Promise) {
    try {
      val external = StatFs(Environment.getDataDirectory().absolutePath)
      val availableBlocks = external.availableBlocksLong
      val blockSize = external.blockSizeLong
      val storage = BigInteger.valueOf(availableBlocks).multiply(BigInteger.valueOf(blockSize))
      // cast down to avoid overflow
      val storageDouble = Math.min(storage.toDouble(), 2.0.pow(53.0) - 1)
      promise.resolve(storageDouble)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject("ERR_FILESYSTEM_CANNOT_DETERMINE_DISK_CAPACITY", "Unable to determine free disk storage capacity", e)
    }
  }

  @ExpoMethod
  fun getContentUriAsync(uri: String, promise: Promise) {
    try {
      val fileUri = Uri.parse(slashifyFilePath(uri))
      ensurePermission(fileUri, Permission.WRITE)
      ensurePermission(fileUri, Permission.READ)
      fileUri.checkIfFileDirExists()
      if (fileUri.scheme == "file") {
        val file = fileUri.toFile()
        promise.resolve(contentUriFromFile(file).toString())
      } else {
        promise.reject("ERR_FILESYSTEM_CANNOT_READ_DIRECTORY", "No readable files with the uri '$uri'. Please use other uri.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  private fun contentUriFromFile(file: File): Uri {
    val activityProvider: ActivityProvider by moduleRegistry()
    val application = activityProvider.currentActivity.application
    return FileProvider.getUriForFile(application, "${application.packageName}.FileSystemFileProvider", file)
  }

  @ExpoMethod
  fun readSAFDirectoryAsync(uriStr: String?, options: Map<String?, Any?>?, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.READ)
      if (uri.isSAFUri) {
        val file = DocumentFile.fromTreeUri(context, uri)
        if (file == null || !file.exists() || !file.isDirectory) {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_READ_DIRECTORY",
            "Uri '$uri' doesn't exist or isn't a directory."
          )
          return
        }
        val children = file.listFiles()
        val result = children.map { it.uri.toString() }
        promise.resolve(result)
      } else {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI. Try using FileSystem.readDirectoryAsync instead.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun makeSAFDirectoryAsync(uriStr: String?, dirName: String?, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      if (!uri.isSAFUri) {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI. Try using FileSystem.makeDirectoryAsync instead.")
      }
      val dir = getNearestSAFFile(uri)
      if (dir != null) {
        if (!dir.isDirectory) {
          promise.reject("ERR_FILESYSTEM_CANNOT_CREATE_DIRECTORY", "Provided uri '$uri' is not pointing to a directory.")
          return
        }
      }
      val newDir = dirName?.let { dir?.createDirectory(it) }
      if (newDir == null) {
        promise.reject("ERR_FILESYSTEM_CANNOT_CREATE_DIRECTORY", "Unknown error.")
        return
      }
      promise.resolve(newDir.uri.toString())
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun createSAFFileAsync(uriStr: String?, fileName: String?, mimeType: String?, promise: Promise) {
    try {
      val uri = Uri.parse(slashifyFilePath(uriStr))
      ensurePermission(uri, Permission.WRITE)
      if (uri.isSAFUri) {
        val dir = getNearestSAFFile(uri)
        if (dir == null || !dir.isDirectory) {
          promise.reject("ERR_FILESYSTEM_CANNOT_CREATE_FILE", "Provided uri '$uri' is not pointing to a directory.")
          return
        }
        if (mimeType == null || fileName == null) {
          promise.reject("ERR_FILESYSTEM_CANNOT_CREATE_FILE", "Parameters fileName and mimeType can not be null.")
          return
        }
        val newFile = dir.createFile(mimeType, fileName)
        if (newFile == null) {
          promise.reject("ERR_FILESYSTEM_CANNOT_CREATE_FILE", "Unknown error.")
          return
        }
        promise.resolve(newFile.uri.toString())
      } else {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI.")
      }
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun requestDirectoryPermissionsAsync(initialFileUrl: String?, promise: Promise) {
    if (dirPermissionsRequest != null) {
      promise.reject("ERR_FILESYSTEM_CANNOT_ASK_FOR_PERMISSIONS", "You have an unfinished permission request.")
      return
    }
    try {
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        initialFileUrl
          ?.let { Uri.parse(slashifyFilePath(it)) }
          ?.let { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, it) }
      }
      val activityProvider: ActivityProvider by moduleRegistry()
      val activity = activityProvider.currentActivity
      if (activity == null) {
        promise.reject("ERR_FILESYSTEM_CANNOT_ASK_FOR_PERMISSIONS", "Can't find activity.")
        return
      }
      uIManager.registerActivityEventListener(this)
      dirPermissionsRequest = promise
      activity.startActivityForResult(intent, DIR_PERMISSIONS_REQUEST_CODE)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject("ERR_FILESYSTEM_CANNOT_ASK_FOR_PERMISSIONS", "Can't ask for permissions.", e)
    }
  }

  private fun createUploadRequest(url: String, fileUriString: String, options: Map<String, Any>, promise: Promise, decorator: RequestBodyDecorator): Request? {
    try {
      val fileUri = Uri.parse(slashifyFilePath(fileUriString))
      ensurePermission(fileUri, Permission.READ)
      fileUri.checkIfFileExists()
      if (!options.containsKey("httpMethod")) {
        promise.reject("ERR_FILESYSTEM_MISSING_HTTP_METHOD", "Missing HTTP method.", null)
        return null
      }
      val method = options["httpMethod"] as String?
      if (!options.containsKey("uploadType")) {
        promise.reject("ERR_FILESYSTEM_MISSING_UPLOAD_TYPE", "Missing upload type.", null)
        return null
      }
      val requestBuilder = Request.Builder().url(url)
      if (options.containsKey(HEADER_KEY)) {
        val headers = options[HEADER_KEY] as Map<String, Any>?
        headers?.forEach { (key, value) -> requestBuilder.addHeader(key, value.toString()) }
      }

      val body = createRequestBody(options, decorator, fileUri.toFile())
      return method?.let { requestBuilder.method(method, body).build() }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
    return null
  }

  private fun createRequestBody(options: Map<String, Any>, decorator: RequestBodyDecorator, file: File): RequestBody? {
    val uploadType = UploadType.fromInt((options["uploadType"] as Double).toInt())
    return when {
      uploadType === UploadType.BINARY_CONTENT -> {
        decorator.decorate(RequestBody.create(null, file))
      }
      uploadType === UploadType.MULTIPART -> {
        val bodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
        options["parameters"]?.let {
          (it as Map<String, Any>)
            .forEach { (key, value) -> bodyBuilder.addFormDataPart(key, value.toString()) }
        }
        val mimeType: String = options["mimeType"]?.let {
          it as String
        } ?: URLConnection.guessContentTypeFromName(file.name)

        val fieldName = options["fieldName"]?.let { it as String } ?: file.name
        bodyBuilder.addFormDataPart(fieldName, file.name, decorator.decorate(file.asRequestBody(mimeType.toMediaTypeOrNull())))
        bodyBuilder.build()
      }
      else -> {
        throw IllegalArgumentException("ERR_FILESYSTEM_INVALID_UPLOAD_TYPE. " + String.format("Invalid upload type: %s.", options["uploadType"]))
      }
    }
  }

  @ExpoMethod
  fun uploadAsync(url: String, fileUriString: String, options: Map<String, Any>, promise: Promise) {
    val request = createUploadRequest(
      url, fileUriString, options, promise,
      RequestBodyDecorator { requestBody -> requestBody }
    ) ?: return

    okHttpClient?.let {
      it.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          Log.e(TAG, e.message.toString())
          promise.reject(e)
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
      promise.reject(NullPointerException("okHttpClient is null"))
    }
  }

  @ExpoMethod
  fun uploadTaskStartAsync(url: String, fileUriString: String, uuid: String, options: Map<String, Any>, promise: Promise) {
    val progressListener: CountingRequestListener = object : CountingRequestListener {
      private var mLastUpdate: Long = -1
      override fun onProgress(bytesWritten: Long, contentLength: Long) {
        val eventEmitter: EventEmitter by moduleRegistry()
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
          eventEmitter.emit(EXUploadProgressEventName, uploadProgress)
        }
      }
    }
    val request = createUploadRequest(
      url,
      fileUriString,
      options,
      promise,
      object : RequestBodyDecorator {
        override fun decorate(requestBody: RequestBody): RequestBody {
          return CountingRequestBody(requestBody, progressListener)
        }
      }
    ) ?: return
    val call = okHttpClient!!.newCall(request)
    taskHandlers[uuid] = TaskHandler(call)
    call.enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        if (call.isCanceled()) {
          promise.resolve(null)
          return
        }
        Log.e(TAG, e.message.toString())
        promise.reject(e)
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

  @ExpoMethod
  fun downloadAsync(url: String, uriStr: String?, options: Map<String?, Any?>?, promise: Promise) {
    try {
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
          options?.get("md5").takeIf { it == true }?.let { result.putString("md5", md5(file)) }
          promise.resolve(result)
        }
        "file" == uri.scheme -> {
          val requestBuilder = Request.Builder().url(url)
          if (options != null && options.containsKey(HEADER_KEY)) {
            try {
              val headers = options[HEADER_KEY] as Map<String, Any>?
              headers?.forEach { (key, value) ->
                requestBuilder.addHeader(key, value.toString())
              }
            } catch (exception: ClassCastException) {
              promise.reject("ERR_FILESYSTEM_INVALID_HEADERS", "Invalid headers dictionary. Keys and values should be strings.", exception)
              return
            }
          }
          okHttpClient?.newCall(requestBuilder.build())?.enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
              Log.e(TAG, e.message.toString())
              promise.reject(e)
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
                if (options?.get("md5") == true) {
                  putString("md5", md5(file))
                }
              }
              response.close()
              promise.resolve(result)
            }
          }) ?: run {
            promise.reject(NullPointerException("okHttpClient is null"))
          }
        }
        else -> throw IOException("Unsupported scheme for location '$uri'.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun networkTaskCancelAsync(uuid: String, promise: Promise) {
    val taskHandler = taskHandlers[uuid]
    taskHandler?.call?.cancel()
    promise.resolve(null)
  }

  @ExpoMethod
  fun downloadResumableStartAsync(url: String, fileUriStr: String, uuid: String, options: Map<String?, Any?>, resumeData: String?, promise: Promise) {
    try {
      val fileUri = Uri.parse(slashifyFilePath(fileUriStr))
      fileUri.checkIfFileDirExists()
      if (fileUri.scheme != "file") {
        throw IOException("Unsupported scheme for location '$fileUri'.")
      }
      val progressListener: ProgressListener = object : ProgressListener {
        var mLastUpdate: Long = -1
        override fun update(bytesRead: Long, contentLength: Long, done: Boolean) {
          val eventEmitter by moduleRegistry<EventEmitter>()
          if (eventEmitter != null) {
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
              eventEmitter.emit(EXDownloadProgressEventName, downloadProgress)
            }
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
        promise.reject(NullPointerException("okHttpClient is null"))
        return
      }
      val requestBuilder = Request.Builder()
      resumeData?.let {
        requestBuilder.addHeader("Range", "bytes=$it-")
      }
      if (options.containsKey(HEADER_KEY)) {
        val headers = options[HEADER_KEY] as Map<String, Any>?
        headers?.forEach { (key, value) ->
          requestBuilder.addHeader(key, value.toString())
        }
      }
      DownloadResumableTask().apply {
        val request = requestBuilder.url(url).build()
        val call = client.newCall(request)
        taskHandlers[uuid] = DownloadTaskHandler(fileUri, call)
        val params = DownloadResumableTaskParams(
          options, call, fileUri.toFile(), resumeData != null, promise
        )
        execute(params)
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun downloadResumablePauseAsync(uuid: String, promise: Promise) {
    val taskHandler = taskHandlers[uuid]
    if (taskHandler == null) {
      val e: Exception = IOException("No download object available")
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
      return
    }
    if (taskHandler !is DownloadTaskHandler) {
      promise.reject("ERR_FILESYSTEM_CANNOT_FIND_TASK", "Cannot find task.")
      return
    }
    taskHandler.call.cancel()
    taskHandlers.remove(uuid)
    try {
      val file = taskHandler.fileUri.toFile()
      val result = Bundle().apply {
        putString("resumeData", file.length().toString())
      }
      promise.resolve(result)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @SuppressLint("WrongConstant")
  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == DIR_PERMISSIONS_REQUEST_CODE && dirPermissionsRequest != null) {
      val result = Bundle()
      if (resultCode == Activity.RESULT_OK && data != null) {
        val treeUri = data.data
        val takeFlags = (
          data.flags
            and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
          )
        treeUri?.let {
          activity.contentResolver.takePersistableUriPermission(it, takeFlags)
        }
        result.putBoolean("granted", true)
        result.putString("directoryUri", treeUri.toString())
      } else {
        result.putBoolean("granted", false)
      }
      dirPermissionsRequest?.resolve(result)
      uIManager.unregisterActivityEventListener(this)
      dirPermissionsRequest = null
    }
  }

  override fun onNewIntent(intent: Intent) = Unit
  private class DownloadResumableTaskParams internal constructor(var options: Map<String?, Any?>?, var call: Call, var file: File, var isResume: Boolean, var promise: Promise)
  private inner class DownloadResumableTask : AsyncTask<DownloadResumableTaskParams?, Void?, Void?>() {
    override fun doInBackground(vararg params: DownloadResumableTaskParams?): Void? {
      val call = params[0]?.call
      val promise = params[0]?.promise
      val file = params[0]?.file
      val isResume = params[0]?.isResume
      val options = params[0]?.options
      return try {
        val response = call!!.execute()
        val responseBody = response.body
        val input = BufferedInputStream(responseBody!!.byteStream())
        val output = FileOutputStream(file, isResume == true)
        val data = ByteArray(1024)
        var count = 0
        while (input.read(data).also { count = it } != -1) {
          output.write(data, 0, count)
        }
        val result = Bundle().apply {
          putString("uri", Uri.fromFile(file).toString())
          putInt("status", response.code)
          putBundle("headers", translateHeaders(response.headers))
          options?.get("md5").takeIf { it == true }?.let { putString("md5", file?.let { md5(it) }) }
        }
        response.close()
        promise?.resolve(result)
        null
      } catch (e: Exception) {
        if (call?.isCanceled() == true) {
          promise?.resolve(null)
          return null
        }
        e.message?.let { Log.e(TAG, it) }
        promise?.reject(e)
        null
      }
    }
  }

  private open class TaskHandler(val call: Call)
  private class DownloadTaskHandler(val fileUri: Uri, call: Call) : TaskHandler(call)

  // https://github.com/square/okhttp/blob/master/samples/guide/src/main/java/okhttp3/recipes/Progress.java
  private class ProgressResponseBody internal constructor(private val responseBody: ResponseBody?, private val progressListener: ProgressListener) : ResponseBody() {
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
        val cookieHandler: CookieHandler by moduleRegistry()
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

  @Throws(IOException::class)
  private fun ensureDirExists(dir: File) {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
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
    val size = content.map { getFileSize(it) }.reduceOrNull { total, itemSize -> total + itemSize } ?: 0
    return size
  }

  private fun getEncodingFromOptions(options: Map<String?, Any?>): String {
    return if (options.containsKey("encoding") && options["encoding"] is String) {
      (options["encoding"] as String).lowercase(Locale.ROOT)
    } else {
      "utf8"
    }
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

  /**
   * Checks if the provided URI is compatible with the Storage Access Framework.
   * For more information check out https://developer.android.com/guide/topics/providers/document-provider.
   *
   * @param uri
   * @return whatever the provided URI is SAF URI
   */

  // extension functions of Uri class
  private fun Uri.toFile() = File(this.path)

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
      if (responseHeaders[headerName] != null) {
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
