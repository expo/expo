package expo.modules.asset

import android.net.Uri
import android.util.Log
import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStream
import java.net.URI
import java.security.MessageDigest

internal class UnableToDownloadAssetException(url: String, cause: Throwable? = null) :
  CodedException("Unable to download asset from url: $url", cause)

internal class FailedToDownloadAssetException(url: String) :
  CodedException("Failed to download asset from url: $url")

@ExpoModule("ExpoAsset")
class AssetModule : Module() {
  @JS
  suspend fun downloadAsync(uri: URI, md5Hash: String?, type: String): String =
    withContext(Dispatchers.IO) {
      if (uri.scheme == "file" && !uri.toString().startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
        return@withContext uri.toString()
      }

      val cacheFileId = md5Hash ?: getMD5HashOfFilePath(uri)
      val cacheDirectory = androidContext.cacheDir

      val localUrl = File("$cacheDirectory/ExponentAsset-$cacheFileId.$type")

      if (!localUrl.exists()) {
        return@withContext downloadAsset(uri, localUrl)
      }

      if (md5Hash == null || md5Hash == getMD5HashOfFileContent(localUrl)) {
        return@withContext Uri.fromFile(localUrl).toString()
      }

      downloadAsset(uri, localUrl)
    }

  private fun getMD5HashOfFilePath(uri: URI): String {
    val md = MessageDigest.getInstance("MD5")
    return md.digest(uri.toString().toByteArray()).joinToString("") { "%02x".format(it) }
  }

  private suspend fun downloadAsset(uri: URI, localUrl: File): String {
    if (localUrl.parentFile?.exists() != true) {
      localUrl.mkdirs()
    }

    try {
      val bytesCopied = uri
        .toInputStream()
        .use { input -> input.copyTo(localUrl) }
      if (bytesCopied == 0L) {
        Log.w("ExpoAsset", "Asset downloaded to $localUrl is empty. It might be conflicting with another asset, or corrupted.")
      }
      return Uri.fromFile(localUrl).toString()
    } catch (e: Exception) {
      throw UnableToDownloadAssetException(uri.toString(), e)
    }
  }

  private suspend fun URI.toInputStream(): InputStream {
    val uriString = this.toString()
    if (!uriString.contains(":")) {
      return openAssetResourceStream(androidContext, uriString)
    }

    if (uriString.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
      return openAndroidResStream(androidContext, uriString)
    }

    return openRemoteStream(uriString)
      ?: throw FailedToDownloadAssetException(uriString)
  }

  private fun InputStream.copyTo(file: File): Long {
    return file.outputStream().use { output ->
      this.copyTo(output)
    }
  }
}
