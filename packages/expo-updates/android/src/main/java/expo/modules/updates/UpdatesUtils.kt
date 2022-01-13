package expo.modules.updates

import android.content.Context
import expo.modules.updates.UpdatesConfiguration.CheckAutomaticallyConfiguration
import expo.modules.updates.db.entity.AssetEntity
import android.os.AsyncTask
import android.net.ConnectivityManager
import android.util.Log
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.apache.commons.io.FileUtils
import org.json.JSONObject
import java.io.*
import java.lang.ClassCastException
import java.lang.Exception
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference
import java.security.DigestInputStream
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.text.DateFormat
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import kotlin.experimental.and

object UpdatesUtils {
  private val TAG = UpdatesUtils::class.java.simpleName

  private const val UPDATES_DIRECTORY_NAME = ".expo-internal"
  private const val UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent"

  @Throws(Exception::class)
  fun getHeadersMapFromJSONString(stringifiedJSON: String): Map<String, String> {
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
  fun sha256AndWriteToFile(inputStream: InputStream?, destination: File): ByteArray {
    DigestInputStream(inputStream, MessageDigest.getInstance("SHA-256")).use { digestInputStream ->
      // write file atomically by writing it to a temporary path and then renaming
      // this protects us against partially written files if the process is interrupted
      val tmpFile = File(destination.absolutePath + ".tmp")
      FileUtils.copyInputStreamToFile(digestInputStream, tmpFile)
      if (!tmpFile.renameTo(destination)) {
        throw IOException("File download was successful, but failed to move from temporary to permanent location " + destination.absolutePath)
      }
      val md = digestInputStream.messageDigest
      return md.digest()
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
    eventName: String,
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
              eventParams!!.putString("type", eventName)
              emitter.emit(UPDATES_EVENT_NAME, eventParams)
              return@execute
            }
          }
          Log.e(TAG, "Could not emit $eventName event; no event emitter was found.")
        } catch (e: Exception) {
          Log.e(TAG, "Could not emit $eventName event; no react context was found.")
        }
      }
    } else {
      Log.e(
        TAG,
        "Could not emit $eventName event; UpdatesController was not initialized with an instance of ReactApplication."
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
  fun parseDateString(dateString: String?): Date {
    return try {
      val formatter: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US)
      formatter.parse(dateString)
    } catch (e: ParseException) {
      Log.e(TAG, "Failed to parse date string on first try: $dateString", e)
      // some old Android versions don't support the 'X' character in SimpleDateFormat, so try without this
      val formatter: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
      formatter.timeZone = TimeZone.getTimeZone("GMT")
      // throw if this fails too
      formatter.parse(dateString)
    } catch (e: IllegalArgumentException) {
      Log.e(TAG, "Failed to parse date string on first try: $dateString", e)
      val formatter: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
      formatter.timeZone = TimeZone.getTimeZone("GMT")
      formatter.parse(dateString)
    }
  }
}
