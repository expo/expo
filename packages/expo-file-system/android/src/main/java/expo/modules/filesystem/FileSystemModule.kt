package expo.modules.filesystem

import android.annotation.SuppressLint
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import androidx.documentfile.provider.DocumentFile
import expo.modules.core.interfaces.ExpoMethod
import android.os.Bundle
import android.os.StatFs
import android.content.Intent
import android.provider.DocumentsContract
import android.app.Activity
import android.content.Context
import android.net.Uri
import expo.modules.core.interfaces.services.EventEmitter
import android.os.AsyncTask
import android.os.Build
import android.os.Environment
import android.util.Base64
import android.util.Log
import androidx.core.content.FileProvider
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.filesystem.Permission
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Headers
import okhttp3.JavaNetCookieJar
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Okio
import okio.Source
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
import java.lang.ClassCastException
import java.lang.Exception
import java.lang.NullPointerException
import java.math.BigInteger
import java.net.CookieHandler
import java.net.URLConnection
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.math.pow

class FileSystemModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), ActivityEventListener {

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val uIManager: UIManager by moduleRegistry()
  private var client: OkHttpClient? = null
  private var dirPermissionsRequest: Promise? = null
  private val taskHandlers: MutableMap<String, TaskHandler> = HashMap()

  private enum class UploadType(private val value: Int) {
    INVALID(-1), BINARY_CONTENT(0), MULTIPART(1);

    companion object {
      fun fromInt(value: Int): UploadType {
        for (method in values()) {
          if (value == method.value) {
            return method
          }
        }
        return INVALID
      }
    }
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): Map<String, Any> {
    val constants: MutableMap<String, Any> = HashMap()
    constants["documentDirectory"] = Uri.fromFile(context.filesDir).toString() + "/"
    constants["cacheDirectory"] = Uri.fromFile(context.cacheDir).toString() + "/"
    constants["bundleDirectory"] = "asset:///"
    return constants
  }

  private fun uriToFile(uri: Uri): File {
    return File(uri.path)
  }

  @Throws(IOException::class)
  private fun checkIfFileExists(uri: Uri) {
    val file = uriToFile(uri)
    if (!file.exists()) {
      throw IOException("Directory for " + file.path + " doesn't exist.")
    }
  }

  @Throws(IOException::class)
  private fun checkIfFileDirExists(uri: Uri) {
    val file = uriToFile(uri)
    val dir = file.parentFile
    if (dir == null || !dir.exists()) {
      throw IOException("Directory for " + file.path + " doesn't exist. Please make sure directory '" + file.parent + "' exists before calling downloadAsync.")
    }
  }

  private fun permissionsForPath(path: String?): EnumSet<Permission>? {
    val filePermissionModule: FilePermissionModuleInterface by moduleRegistry()
    return filePermissionModule.getPathPermissions(context, path)
  }

  private fun permissionsForUri(uri: Uri): EnumSet<Permission>? {
    return if (isSAFUri(uri)) {
      permissionsForSAFUri(uri)
    } else when (uri.scheme) {
      "content" -> EnumSet.of(Permission.READ)
      "asset" -> EnumSet.of(Permission.READ)
      "file" -> permissionsForPath(uri.path)
      null -> EnumSet.of(Permission.READ)
      else -> EnumSet.noneOf(Permission::class.java)
    }
  }

  private fun permissionsForSAFUri(uri: Uri): EnumSet<Permission> {
    val documentFile = getNearestSAFFile(uri)
    val permissions = EnumSet.noneOf(Permission::class.java)
    if (documentFile != null && documentFile.canRead()) {
      permissions.add(Permission.READ)
    }
    if (documentFile != null && documentFile.canWrite()) {
      permissions.add(Permission.WRITE)
    }
    return permissions
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
    ensurePermission(uri, permission, "Location '" + uri + "' doesn't have permission '" + permission.name + "'.")
  }

  @Throws(IOException::class)
  private fun openAssetInputStream(uri: Uri): InputStream {
    // AssetManager expects no leading slash.
    val asset = uri.path!!.substring(1)
    return context.assets.open(asset)
  }

  @Throws(IOException::class)
  private fun openResourceInputStream(resourceName: String?): InputStream {
    var resourceId = context.resources.getIdentifier(resourceName, "raw", context.packageName)
    if (resourceId == 0) {
      // this resource doesn't exist in the raw folder, so try drawable
      resourceId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)
      if (resourceId == 0) {
        throw FileNotFoundException("No resource found with the name $resourceName")
      }
    }
    return context.resources.openRawResource(resourceId)
  }

  @ExpoMethod
  fun getInfoAsync(_uriStr: String, options: Map<String?, Any?>, promise: Promise) {
    var uriStr = _uriStr
    try {
      val uri = Uri.parse(uriStr)
      var absoluteUri = uri
      if (uri.scheme == "file") {
        uriStr = uriStr.substring(uriStr.indexOf(':') + 3)
        absoluteUri = Uri.parse(uriStr)
      }
      ensurePermission(absoluteUri, Permission.READ)
      if (uri.scheme == "file") {
        val file = uriToFile(absoluteUri)
        if (file.exists()) {
          promise.resolve(
            Bundle().apply {
              putBoolean("exists", true)
              putBoolean("isDirectory", file.isDirectory)
              putString("uri", Uri.fromFile(file).toString())
              putDouble("size", getFileSize(file).toDouble())
              putDouble("modificationTime", 0.001 * file.lastModified())
              if (options.containsKey("md5") && (options["md5"] == true)) {
                putString("md5", md5(file))
              }
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
          val `is`: InputStream = when (uri.scheme) {
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
              putDouble("size", `is`.available().toDouble())
              if (options.containsKey("md5") && options["md5"] == true) {
                val md5bytes = DigestUtils.md5(`is`)
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
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.READ)

      // TODO:Bacon: Add more encoding types to match iOS
      val encoding = if (options.containsKey("encoding") && options["encoding"] is String) {
        (options["encoding"] as String).toLowerCase(Locale.ROOT)
      } else {
        "utf8"
      }
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
          uri.scheme == "file" -> IOUtils.toString(FileInputStream(uriToFile(uri)))
          uri.scheme == "asset" -> IOUtils.toString(openAssetInputStream(uri))
          uri.scheme == null -> IOUtils.toString(openResourceInputStream(uriStr))
          isSAFUri(uri) -> IOUtils.toString(context.contentResolver.openInputStream(uri))
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
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.WRITE)
      val encoding = if (options.containsKey("encoding") && options["encoding"] is String) {
        (options["encoding"] as String).toLowerCase(Locale.ROOT)
      } else {
        "utf8"
      }
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
      val uri = Uri.parse(uriStr)
      val appendedUri = Uri.withAppendedPath(uri, "..")
      ensurePermission(appendedUri, Permission.WRITE, "Location '$uri' isn't deletable.")
      if (uri.scheme == "file") {
        val file = uriToFile(uri)
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
      } else if (isSAFUri(uri)) {
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
      val fromUri = Uri.parse(options["from"] as String?)
      ensurePermission(Uri.withAppendedPath(fromUri, ".."), Permission.WRITE, "Location '$fromUri' isn't movable.")
      if (!options.containsKey("to")) {
        promise.reject("ERR_FILESYSTEM_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.")
        return
      }
      val toUri = Uri.parse(options["to"] as String?)
      ensurePermission(toUri, Permission.WRITE)
      if (fromUri.scheme == "file") {
        val from = uriToFile(fromUri)
        val to = uriToFile(toUri)
        if (from.renameTo(to)) {
          promise.resolve(null)
        } else {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_MOVE_FILE",
            "File '$fromUri' could not be moved to '$toUri'"
          )
        }
      } else if (isSAFUri(fromUri)) {
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
      val fromUri = Uri.parse(options["from"] as String?)
      ensurePermission(fromUri, Permission.READ)
      if (!options.containsKey("to")) {
        promise.reject("ERR_FILESYSTEM_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.")
        return
      }
      val toUri = Uri.parse(options["to"] as String?)
      ensurePermission(toUri, Permission.WRITE)
      when {
        fromUri.scheme == "file" -> {
          val from = uriToFile(fromUri)
          val to = uriToFile(toUri)
          if (from.isDirectory) {
            FileUtils.copyDirectory(from, to)
          } else {
            FileUtils.copyFile(from, to)
          }
          promise.resolve(null)
        }
        isSAFUri(fromUri) -> {
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
          val `in` = context.contentResolver.openInputStream(fromUri)
          val out: OutputStream = FileOutputStream(uriToFile(toUri))
          IOUtils.copy(`in`, out)
          promise.resolve(null)
        }
        fromUri.scheme == "asset" -> {
          val `in` = openAssetInputStream(fromUri)
          val out: OutputStream = FileOutputStream(uriToFile(toUri))
          IOUtils.copy(`in`, out)
          promise.resolve(null)
        }
        fromUri.scheme == null -> {
          // this is probably an asset embedded by the packager in resources
          val `in` = openResourceInputStream(options["from"] as String?)
          val out: OutputStream = FileOutputStream(uriToFile(toUri))
          IOUtils.copy(`in`, out)
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
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.WRITE)
      if (uri.scheme == "file") {
        val file = uriToFile(uri)
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
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.READ)
      if (uri.scheme == "file") {
        val file = uriToFile(uri)
        val children = file.listFiles()
        if (children != null) {
          val result: MutableList<String> = ArrayList()
          for (child in children) {
            result.add(child.name)
          }
          promise.resolve(result)
        } else {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_READ_DIRECTORY",
            "Directory '$uri' could not be read."
          )
        }
      } else if (isSAFUri(uri)) {
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
      val fileUri = Uri.parse(uri)
      ensurePermission(fileUri, Permission.WRITE)
      ensurePermission(fileUri, Permission.READ)
      checkIfFileDirExists(fileUri)
      if (fileUri.scheme == "file") {
        val file = uriToFile(fileUri)
        promise.resolve(contentUriFromFile(file).toString())
      } else {
        promise.reject("ERR_FILESYSTEM_CANNOT_READ_DIRECTORY", "No readable files with the uri: $uri. Please use other uri.")
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  private fun contentUriFromFile(file: File): Uri {
    return try {
      val activityProvider: ActivityProvider by moduleRegistry()
      val application = activityProvider.currentActivity.application
      FileProvider.getUriForFile(application, application.packageName + ".FileSystemFileProvider", file)
    } catch (e: Exception) {
      throw e
    }
  }

  @ExpoMethod
  fun readSAFDirectoryAsync(uriStr: String?, options: Map<String?, Any?>?, promise: Promise) {
    try {
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.READ)
      if (isSAFUri(uri)) {
        val file = DocumentFile.fromTreeUri(context, uri)
        if (file == null || !file.exists() || !file.isDirectory) {
          promise.reject(
            "ERR_FILESYSTEM_CANNOT_READ_DIRECTORY",
            "Uri '$uri' doesn't exist or isn't a directory."
          )
          return
        }
        val children = file.listFiles()
        val result: MutableList<String> = ArrayList()
        for (child in children) {
          result.add(child.uri.toString())
        }
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
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.WRITE)
      if (isSAFUri(uri)) {
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
      } else {
        throw IOException("The URI '$uri' is not a Storage Access Framework URI. Try using FileSystem.makeDirectoryAsync instead.")
      }
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun createSAFFileAsync(uriStr: String?, fileName: String?, mimeType: String?, promise: Promise) {
    try {
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.WRITE)
      if (isSAFUri(uri)) {
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
        val fileUri = if (initialFileUrl == null) null else Uri.parse(initialFileUrl)
        if (fileUri != null) {
          intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, fileUri)
        }
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
      val fileUri = Uri.parse(fileUriString)
      ensurePermission(fileUri, Permission.READ)
      checkIfFileExists(fileUri)
      if (!options.containsKey("httpMethod")) {
        promise.reject("ERR_FILESYSTEM_MISSING_HTTP_METHOD", "Missing HTTP method.", null)
        return null
      }
      val method = options["httpMethod"] as String?
      if (!options.containsKey("uploadType")) {
        promise.reject("ERR_FILESYSTEM_MISSING_UPLOAD_TYPE", "Missing upload type.", null)
        return null
      }
      val uploadType = UploadType.fromInt((options["uploadType"] as Double).toInt())
      val requestBuilder = Request.Builder().url(url)
      if (options.containsKey(HEADER_KEY)) {
        val headers = options[HEADER_KEY] as Map<String, Any>?
        if (headers != null) {
          for (key in headers.keys) {
            requestBuilder.addHeader(key, headers[key].toString())
          }
        }
      }
      val file = uriToFile(fileUri)
      when (uploadType) {
        UploadType.BINARY_CONTENT -> {
          val body = decorator.decorate(RequestBody.create(null, file))
          requestBuilder.method(method, body)
        }
        UploadType.MULTIPART -> {
          val bodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
          if (options.containsKey("parameters")) {
            val parametersMap = options["parameters"] as Map<String, Any>?
            if (parametersMap != null) {
              for (key in parametersMap.keys) {
                bodyBuilder.addFormDataPart(key, parametersMap[key].toString())
              }
            }
          }
          val mimeType: String? = if (options.containsKey("mimeType")) {
            options["mimeType"] as String?
          } else {
            URLConnection.guessContentTypeFromName(file.name)
          }
          var fieldName = file.name
          if (options.containsKey("fieldName")) {
            fieldName = options["fieldName"] as String
          }
          bodyBuilder.addFormDataPart(fieldName, file.name, decorator.decorate(RequestBody.create(if (mimeType != null) MediaType.parse(mimeType) else null, file)))
          requestBuilder.method(method, bodyBuilder.build())
          return requestBuilder.build()
        }
        else -> {
          promise.reject("ERR_FILESYSTEM_INVALID_UPLOAD_TYPE", String.format("Invalid upload type: %s.", options["uploadType"]), null)
          return null
        }
      }
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
    return null
  }

  @ExpoMethod
  fun uploadAsync(url: String, fileUriString: String, options: Map<String, Any>, promise: Promise) {
    val request = createUploadRequest(
      url, fileUriString, options, promise,
      object : RequestBodyDecorator {
        override fun decorate(requestBody: RequestBody): RequestBody {
          return requestBody
        }
      }
    ) ?: return

    okHttpClient?.let {
      it.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          Log.e(TAG, e.message.toString())
          promise.reject(e)
        }

        override fun onResponse(call: Call, response: Response) {
          val result = Bundle().apply {
            putString("body", response.body()?.string())
            putInt("status", response.code())
            putBundle("headers", translateHeaders(response.headers()))
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
          uploadProgressData.putDouble("totalByteSent", bytesWritten.toDouble())
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
        if (call.isCanceled) {
          promise.resolve(null)
          return
        }
        Log.e(TAG, e.message.toString())
        promise.reject(e)
      }

      override fun onResponse(call: Call, response: Response) {
        val result = Bundle()
        val body = response.body()
        result.apply {
          putString("body", body?.string())
          putInt("status", response.code())
          putBundle("headers", translateHeaders(response.headers()))
        }
        response.close()
        promise.resolve(result)
      }
    })
  }

  @ExpoMethod
  fun downloadAsync(url: String, uriStr: String?, options: Map<String?, Any?>?, promise: Promise) {
    try {
      val uri = Uri.parse(uriStr)
      ensurePermission(uri, Permission.WRITE)
      checkIfFileDirExists(uri)
      if (!url.contains(":")) {
        val context = context
        val resources = context.resources
        val packageName = context.packageName
        val resourceId = resources.getIdentifier(url, "raw", packageName)
        val bufferedSource = Okio.buffer(Okio.source(context.resources.openRawResource(resourceId)))
        val file = uriToFile(uri)
        file.delete()
        val sink = Okio.buffer(Okio.sink(file))
        sink.writeAll(bufferedSource)
        sink.close()
        val result = Bundle()
        result.putString("uri", Uri.fromFile(file).toString())
        if (options != null && options.containsKey("md5") && options["md5"] as Boolean) {
          result.putString("md5", md5(file))
        }
        promise.resolve(result)
      } else if ("file" == uri.scheme) {
        val requestBuilder = Request.Builder().url(url)
        if (options != null && options.containsKey(HEADER_KEY)) {
          try {
            val headers = options[HEADER_KEY] as Map<String, Any>?
            headers?.keys?.forEach { key ->
              requestBuilder.addHeader(key, headers[key] as String)
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
            val file = uriToFile(uri)
            file.delete()
            val sink = Okio.buffer(Okio.sink(file))
            sink.writeAll(response.body()!!.source())
            sink.close()
            val result = Bundle()
            result.putString("uri", Uri.fromFile(file).toString())
            if (options != null && options.containsKey("md5") && (options["md5"] as Boolean)) {
              result.putString("md5", md5(file))
            }
            result.putInt("status", response.code())
            result.putBundle("headers", translateHeaders(response.headers()))
            response.close()
            promise.resolve(result)
          }
        }) ?: run {
          promise.reject(NullPointerException("okHttpClient is null"))
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
  fun networkTaskCancelAsync(uuid: String, promise: Promise) {
    val taskHandler = taskHandlers[uuid]
    taskHandler?.call?.cancel()
    promise.resolve(null)
  }

  @ExpoMethod
  fun downloadResumableStartAsync(url: String, fileUriStr: String, uuid: String, options: Map<String?, Any?>, resumeData: String?, promise: Promise) {
    try {
      val fileUri = Uri.parse(fileUriStr)
      checkIfFileDirExists(fileUri)
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
            .body(ProgressResponseBody(originalResponse.body(), progressListener))
            .build()
        }
        ?.build()
      if (client == null) {
        promise.reject(NullPointerException("okHttpClient is null"))
        return
      }
      val requestBuilder = Request.Builder()
      resumeData.let {
        requestBuilder.addHeader("Range", "bytes=$it-")
      }
      if (options.containsKey(HEADER_KEY)) {
        val headers = options[HEADER_KEY] as Map<String, Any>?
        if (headers != null) {
          for (key in headers.keys) {
            requestBuilder.addHeader(key, headers[key].toString())
          }
        }
      }
      val request = requestBuilder.url(url).build()
      val call = client.newCall(request)
      val taskHandler: TaskHandler = DownloadTaskHandler(fileUri, call)
      taskHandlers[uuid] = taskHandler
      val file = uriToFile(fileUri)
      val params = DownloadResumableTaskParams(options, call, file, resumeData != null, promise)
      val task = DownloadResumableTask()
      task.execute(params)
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
      val file = uriToFile(taskHandler.fileUri)
      val result = Bundle()
      result.putString("resumeData", file.length().toString())
      promise.resolve(result)
    } catch (e: Exception) {
      e.message?.let { Log.e(TAG, it) }
      promise.reject(e)
    }
  }

  @SuppressLint("WrongConstant")
  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent) {
    if (requestCode == DIR_PERMISSIONS_REQUEST_CODE && dirPermissionsRequest != null) {
      val result = Bundle()
      if (resultCode == Activity.RESULT_OK) {
        val treeUri = data.data
        val takeFlags = (
          data.flags
            and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
          )
        if (treeUri != null) {
          activity.contentResolver.takePersistableUriPermission(treeUri, takeFlags)
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

  override fun onNewIntent(intent: Intent) {}
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
        val responseBody = response.body()
        val input = BufferedInputStream(responseBody!!.byteStream())
        val output: OutputStream = if (isResume == true) {
          FileOutputStream(file, true)
        } else {
          FileOutputStream(file, false)
        }
        val data = ByteArray(1024)
        var count = 0
        while (input.read(data).also { count = it } != -1) {
          output.write(data, 0, count)
        }
        val result = Bundle().apply {
          putString("uri", Uri.fromFile(file).toString())
          putInt("status", response.code())
          putBundle("headers", translateHeaders(response.headers()))
          if (options != null && options.containsKey("md5") && (options["md5"] as Boolean)) {
            putString("md5", file?.let { md5(it) })
          }
        }
        response.close()
        promise?.resolve(result)
        null
      } catch (e: Exception) {
        if (call != null) {
          if (call.isCanceled) {
            promise?.resolve(null)
            return null
          }
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
    override fun contentType(): MediaType? {
      return responseBody?.contentType()
    }

    override fun contentLength(): Long {
      return responseBody?.contentLength() ?: -1
    }

    override fun source(): BufferedSource {
      return bufferedSource ?: Okio.buffer(source(responseBody!!.source()))
    }

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

  internal interface ProgressListener {
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
    val `is`: InputStream = FileInputStream(file)
    return `is`.use {
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
    var size: Long = 0
    for (item in content) {
      size += getFileSize(item)
    }
    return size
  }

  @Throws(IOException::class)
  private fun getInputStream(uri: Uri): InputStream {
    return when {
      uri.scheme == "file" -> FileInputStream(uriToFile(uri))
      uri.scheme == "asset" -> openAssetInputStream(uri)
      isSAFUri(uri) -> context.contentResolver.openInputStream(uri)!!
      else -> throw IOException("Unsupported scheme for location '$uri'.")
    }
  }

  @Throws(IOException::class)
  private fun getOutputStream(uri: Uri): OutputStream {
    return when {
      uri.scheme == "file" -> FileOutputStream(uriToFile(uri))
      isSAFUri(uri) -> context.contentResolver.openOutputStream(uri)!!
      else -> throw IOException("Unsupported scheme for location '$uri'.")
    }
  }

  private fun getNearestSAFFile(uri: Uri): DocumentFile? {
    val file = DocumentFile.fromSingleUri(context, uri)
    return if (file != null && file.isFile) {
      file
    } else DocumentFile.fromTreeUri(context, uri)
  }

  companion object {
    private const val NAME = "ExponentFileSystem"
    private val TAG = FileSystemModule::class.java.simpleName
    private const val EXDownloadProgressEventName = "expo-file-system.downloadProgress"
    private const val EXUploadProgressEventName = "expo-file-system.uploadProgress"
    private const val MIN_EVENT_DT_MS: Long = 100
    private const val HEADER_KEY = "headers"
    private const val DIR_PERMISSIONS_REQUEST_CODE = 5394

    /**
     * Checks if the provided URI is compatible with the Storage Access Framework.
     * For more information check out https://developer.android.com/guide/topics/providers/document-provider.
     *
     * @param uri
     * @return whatever the provided URI is SAF URI
     */
    private fun isSAFUri(uri: Uri): Boolean {
      return uri.scheme == "content" && uri.host?.startsWith("com.android.externalstorage") ?: false
    }

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
      for (i in 0 until headers.size()) {
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

  init {
    try {
      ensureDirExists(getContext().filesDir)
      ensureDirExists(getContext().cacheDir)
    } catch (e: IOException) {
      e.printStackTrace()
    }
  }
}
