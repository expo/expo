package expo.modules.asset

import android.content.Context
import android.net.Uri
import android.util.Log
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.net.URI
import java.security.DigestInputStream
import java.security.MessageDigest

internal class UnableToDownloadAssetException(url: String) :
  CodedException("Unable to download asset from url: $url")

class AssetModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  private fun getMD5HashOfFilePath(uri: URI): String {
    val md = MessageDigest.getInstance("MD5")
    return md.digest(uri.toString().toByteArray()).joinToString("") { "%02x".format(it) }
  }

  private fun getMD5HashOfFileContent(file: File): String? {
    return try {
      FileInputStream(file).use { inputStream ->
        DigestInputStream(
          inputStream,
          MessageDigest.getInstance("MD5")
        ).use { digestInputStream ->
          digestInputStream.messageDigest.digest().joinToString(separator = "") { "%02x".format(it) }
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
      null
    }
  }

  private suspend fun downloadAsset(appContext: AppContext, uri: URI, localUrl: File): Uri {
    if (localUrl.parentFile?.exists() != true) {
      localUrl.mkdirs()
    }

    if (appContext.filePermission?.getPathPermissions(appContext.reactContext, localUrl.parent)?.contains(Permission.WRITE) != true) {
      throw UnableToDownloadAssetException(uri.toString())
    }

    return withContext(appContext.backgroundCoroutineScope.coroutineContext) {
      try {
        val inputStream = when {
          uri.toString().contains(":").not() -> openAssetResourceStream(context, uri.toString())
          uri.toString().startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE) -> openAndroidResStream(context, uri.toString())
          else -> uri.toURL().openStream()
        }
        inputStream.use { input ->
          localUrl.outputStream().use { output ->
            val bytesCopied = input.copyTo(output)
            if (bytesCopied == 0L) {
              Log.w("ExpoAsset", "Asset downloaded to $localUrl is empty. It might be conflicting with another asset, or corrupted.")
            }
          }
        }
        Uri.fromFile(localUrl)
      } catch (e: Exception) {
        throw UnableToDownloadAssetException(uri.toString())
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAsset")

    AsyncFunction("downloadAsync") Coroutine { uri: URI, md5Hash: String?, type: String ->
      if (uri.scheme == "file" && !uri.toString().startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
        return@Coroutine uri
      }

      val cacheFileId = md5Hash ?: getMD5HashOfFilePath(uri)
      val cacheDirectory = appContext.cacheDirectory

      val localUrl = File("$cacheDirectory/ExponentAsset-$cacheFileId.$type")

      if (!localUrl.exists()) {
        return@Coroutine downloadAsset(appContext, uri, localUrl)
      }

      if (md5Hash == null || md5Hash == getMD5HashOfFileContent(localUrl)) {
        return@Coroutine Uri.fromFile(localUrl)
      }

      return@Coroutine downloadAsset(appContext, uri, localUrl)
    }
  }
}
