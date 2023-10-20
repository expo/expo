package expo.modules.updates

import android.content.Context
import expo.modules.updates.UpdatesConfiguration.CheckAutomaticallyConfiguration
import expo.modules.updates.db.entity.AssetEntity
import android.os.AsyncTask
import android.net.ConnectivityManager
import android.util.Base64
import android.util.Log
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import org.apache.commons.io.FileUtils
import org.json.JSONArray
import org.json.JSONObject
import java.io.*
import java.lang.ClassCastException
import java.lang.Exception
import java.lang.ref.WeakReference
import java.security.DigestInputStream
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.text.DateFormat
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import kotlin.experimental.and

/**
 * Miscellaneous helper functions that are used by multiple classes in the library.
 */
object UpdatesUtils {
  private val TAG = UpdatesUtils::class.java.simpleName

  private const val UPDATES_DIRECTORY_NAME = ".expo-internal"

  @Throws(Exception::class)
  fun getMapFromJSONString(stringifiedJSON: String): Map<String, String> {
    val jsonObject = JSONObject(stringifiedJSON)
    val keys = jsonObject.keys()
    val newMap = mutableMapOf<String, String>()
    while (keys.hasNext()) {
      val key = keys.next()
      newMap[key] = try {
        jsonObject[key] as String
      } catch (e: ClassCastException) {
        throw Exception("The values in the JSON object must be strings")
      }
    }
    return newMap
  }

  @Throws(Exception::class)
  fun getStringListFromJSONString(stringifiedJSON: String): List<String> {
    val jsonArray = JSONArray(stringifiedJSON)
    return List(jsonArray.length()) { index -> jsonArray.getString(index) }
  }

  @Throws(Exception::class)
  fun getOrCreateUpdatesDirectory(context: Context): File {
    val updatesDirectory = File(context.filesDir, UPDATES_DIRECTORY_NAME)
    val exists = updatesDirectory.exists()
    if (exists) {
      if (updatesDirectory.isFile) {
        throw Exception("File already exists at the location of the Updates Directory: $updatesDirectory ; aborting")
      }
    } else {
      if (!updatesDirectory.mkdir()) {
        throw Exception("Failed to create Updates Directory: mkdir() returned false")
      }
    }
    return updatesDirectory
  }

  @Throws(NoSuchAlgorithmException::class, UnsupportedEncodingException::class)
  fun sha256(string: String): String {
    return try {
      val md = MessageDigest.getInstance("SHA-256")
      val data = string.toByteArray(charset("UTF-8"))
      md.update(data, 0, data.size)
      val sha1hash = md.digest()
      bytesToHex(sha1hash)
    } catch (e: NoSuchAlgorithmException) {
      Log.e(TAG, "Failed to checksum string via SHA-256", e)
      throw e
    } catch (e: UnsupportedEncodingException) {
      Log.e(TAG, "Failed to checksum string via SHA-256", e)
      throw e
    }
  }

  @Throws(NoSuchAlgorithmException::class, IOException::class)
  fun sha256(file: File): ByteArray {
    try {
      FileInputStream(file).use { inputStream ->
        DigestInputStream(
          inputStream,
          MessageDigest.getInstance("SHA-256")
        ).use { digestInputStream ->
          val md = digestInputStream.messageDigest
          return md.digest()
        }
      }
    } catch (e: NoSuchAlgorithmException) {
      Log.e(TAG, "Failed to checksum file via SHA-256: $file", e)
      throw e
    } catch (e: IOException) {
      Log.e(TAG, "Failed to checksum file via SHA-256: $file", e)
      throw e
    }
  }

  @Throws(NoSuchAlgorithmException::class, IOException::class)
  fun verifySHA256AndWriteToFile(inputStream: InputStream, destination: File, expectedBase64URLEncodedHash: String?): ByteArray {
    DigestInputStream(inputStream, MessageDigest.getInstance("SHA-256")).use { digestInputStream ->
      // write file atomically by writing it to a temporary path and then renaming
      // this protects us against partially written files if the process is interrupted
      val tmpFile = File(destination.absolutePath + ".tmp")
      FileUtils.copyInputStreamToFile(digestInputStream, tmpFile)

      // this message digest must be read after the input stream has been consumed in order to get the hash correctly
      val md = digestInputStream.messageDigest
      val hash = md.digest()
      // base64url - https://datatracker.ietf.org/doc/html/rfc4648#section-5
      val hashBase64String = Base64.encodeToString(hash, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
      if (expectedBase64URLEncodedHash != null && expectedBase64URLEncodedHash != hashBase64String) {
        throw IOException("File download was successful but base64url-encoded SHA-256 did not match expected; expected: $expectedBase64URLEncodedHash; actual: $hashBase64String")
      }

      // only rename after the hash has been verified
      // Since renameTo() does not expose detailed errors, and can fail if source and destination
      // are not on the same mount point, we do a copyTo followed by delete
      try {
        tmpFile.copyTo(destination)
      } catch (e: NoSuchFileException) {
        throw IOException("File download was successful, but temp file ${tmpFile.absolutePath} does not exist")
      } catch (e: FileAlreadyExistsException) {
        throw IOException("File download was successful, but file already exists at ${destination.absolutePath}")
      } catch (e: Exception) {
        throw IOException("File download was successful, but an exception occurred: $e")
      } finally {
        tmpFile.delete()
      }

      return hash
    }
  }

  fun createFilenameForAsset(asset: AssetEntity): String {
    var fileExtension: String? = ""
    if (asset.type != null) {
      fileExtension = if (asset.type!!.startsWith(".")) asset.type else "." + asset.type
    }
    return if (asset.key == null) {
      // create a filename that's unlikely to collide with any other asset
      "asset-" + Date().time + "-" + Random().nextInt() + fileExtension
    } else asset.key + fileExtension
  }

  fun sendEventToReactNative(
    reactNativeHost: WeakReference<ReactNativeHost>?,
    logger: UpdatesLogger,
    eventName: String,
    eventType: String,
    params: WritableMap?
  ) {
    val host = reactNativeHost?.get()
    if (host != null) {
      AsyncTask.execute {
        try {
          var reactContext: ReactContext? = null
          // in case we're trying to send an event before the reactContext has been initialized
          // continue to retry for 5000ms
          for (i in 0..4) {
            // Calling host.reactInstanceManager has a side effect of creating a new
            // reactInstanceManager if there isn't already one. We want to avoid this so we check
            // if it has an instance first.
            if (host.hasInstance()) {
              reactContext = host.reactInstanceManager.currentReactContext
              if (reactContext != null) {
                break
              }
            }
            Thread.sleep(1000)
          }
          if (reactContext != null) {
            val emitter = reactContext.getJSModule(
              DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
            if (emitter != null) {
              var eventParams = params
              if (eventParams == null) {
                eventParams = Arguments.createMap()
              }
              eventParams!!.putString("type", eventType)
              logger.info("Emitted event: name = $eventName, type = $eventType")
              emitter.emit(eventName, eventParams)
              return@execute
            }
          }
          logger.error("Could not emit $eventName $eventType event; no event emitter was found.", UpdatesErrorCode.JSRuntimeError)
        } catch (e: Exception) {
          logger.error("Could not emit $eventName $eventType event; no react context was found.", UpdatesErrorCode.JSRuntimeError)
        }
      }
    } else {
      logger.error(
        "Could not emit $eventType event; UpdatesController was not initialized with an instance of ReactApplication.",
        UpdatesErrorCode.Unknown
      )
    }
  }

  fun shouldCheckForUpdateOnLaunch(
    updatesConfiguration: UpdatesConfiguration,
    context: Context
  ): Boolean {
    if (updatesConfiguration.updateUrl == null) {
      return false
    }
    return when (updatesConfiguration.checkOnLaunch) {
      CheckAutomaticallyConfiguration.NEVER -> false
      // check will happen later on if there's an error
      CheckAutomaticallyConfiguration.ERROR_RECOVERY_ONLY -> false
      CheckAutomaticallyConfiguration.WIFI_ONLY -> {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager?
        if (cm == null) {
          Log.e(
            TAG,
            "Could not determine active network connection is metered; not checking for updates"
          )
          return false
        }
        !cm.isActiveNetworkMetered
      }
      CheckAutomaticallyConfiguration.ALWAYS -> true
    }
  }

  fun getRuntimeVersion(updatesConfiguration: UpdatesConfiguration): String {
    val runtimeVersion = updatesConfiguration.runtimeVersion
    val sdkVersion = updatesConfiguration.sdkVersion
    return if (runtimeVersion != null && runtimeVersion.isNotEmpty()) {
      runtimeVersion
    } else if (sdkVersion != null && sdkVersion.isNotEmpty()) {
      sdkVersion
    } else {
      // various places in the code assume that we have a nonnull runtimeVersion, so if the developer
      // hasn't configured either runtimeVersion or sdkVersion, we'll use a dummy value of "1" but warn
      // the developer in JS that they need to configure one of these values
      "1"
    }
  }

  // https://stackoverflow.com/questions/9655181/how-to-convert-a-byte-array-to-a-hex-string-in-java
  private val HEX_ARRAY = "0123456789ABCDEF".toCharArray()
  fun bytesToHex(bytes: ByteArray): String {
    val hexChars = CharArray(bytes.size * 2)
    for (j in bytes.indices) {
      val v = (bytes[j] and 0xFF.toByte()).toInt()
      hexChars[j * 2] = HEX_ARRAY[v ushr 4]
      hexChars[j * 2 + 1] = HEX_ARRAY[v and 0x0F]
    }
    return String(hexChars)
  }

  @Throws(ParseException::class)
  fun parseDateString(dateString: String): Date {
    try {
      val formatter: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'X'", Locale.US)
      return formatter.parse(dateString) as Date
    } catch (e: Exception) {
      // Don't throw on first attempt
    }
    // First attempt failed, try with 'Z' format string
    try {
      val formatter: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("GMT")
      }
      return formatter.parse(dateString) as Date
    } catch (e: Exception) {
      // Throw if the second parse attempt fails
      throw e
    }
  }
}
