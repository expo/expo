package expo.modules.updates

import android.content.Context
import android.net.ConnectivityManager
import android.util.Base64
import android.util.Log
import expo.modules.updates.UpdatesConfiguration.CheckAutomaticallyConfiguration
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import org.apache.commons.io.FileUtils
import org.json.JSONArray
import org.json.JSONObject
import java.io.*
import java.security.DigestInputStream
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.text.DateFormat
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import java.util.regex.Pattern
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
      // if there are two assets with identical content, they will be written to the same file path,
      // so we allow overwrites
      try {
        tmpFile.copyTo(destination, true)
      } catch (e: NoSuchFileException) {
        throw IOException("File download was successful, but temp file ${tmpFile.absolutePath} does not exist")
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
    } else {
      asset.key + fileExtension
    }
  }

  fun shouldCheckForUpdateOnLaunch(
    updatesConfiguration: UpdatesConfiguration,
    logger: UpdatesLogger,
    context: Context
  ): Boolean {
    return when (updatesConfiguration.checkOnLaunch) {
      CheckAutomaticallyConfiguration.NEVER -> false
      // check will happen later on if there's an error
      CheckAutomaticallyConfiguration.ERROR_RECOVERY_ONLY -> false
      CheckAutomaticallyConfiguration.WIFI_ONLY -> {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager?
        if (cm == null) {
          val cause = Exception("Null ConnectivityManager system service")
          logger.error("Could not determine active network connection is metered; not checking for updates", cause, UpdatesErrorCode.Unknown)
          return false
        }
        !cm.isActiveNetworkMetered
      }
      CheckAutomaticallyConfiguration.ALWAYS -> true
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

  private val PARAMETER_PATTERN: Pattern by lazy {
    val token = "([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)"
    val quoted = "\"([^\"]*)\""
    Pattern.compile(";\\s*(?:\\s*$token\\s*=\\s*(?:$token|$quoted))?\\s*")
  }

  /**
   * Parse name parameter from content-disposition header value.
   *
   * Derived from Okhttp String.toMediaType
   */
  fun String.parseContentDispositionNameParameter(): String? {
    val parameterNamesAndValues = mutableMapOf<String, String?>()
    val parameter = PARAMETER_PATTERN.matcher(this)
    var s = this.indexOf(';')
    while (s < length) {
      parameter.region(s, length)
      require(parameter.lookingAt()) {
        "Parameter is not formatted correctly: \"${substring(s)}\" for: \"$this\""
      }

      val name: String? = parameter.group(1)
      if (name == null) {
        s = parameter.end()
        continue
      }

      val token: String? = parameter.group(2)
      val value: String? = when {
        token == null -> {
          // Value is "double-quoted". That's valid and our regex group already strips the quotes.
          parameter.group(3)
        }
        token.startsWith("'") && token.endsWith("'") && token.length > 2 -> {
          // If the token is 'single-quoted' it's invalid! But we're lenient and strip the quotes.
          token.substring(1, token.length - 1)
        }
        else -> token
      }

      if (!parameterNamesAndValues.containsKey(name)) {
        parameterNamesAndValues[name] = value
      }
      s = parameter.end()
    }
    return parameterNamesAndValues["name"]
  }
}
