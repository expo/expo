package expo.modules.asset

import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.net.URI
import java.security.DigestInputStream
import java.security.MessageDigest

internal class UnableToDownloadAssetException(url: String) :
  CodedException("Unable to download asset from url: $url")

class AssetModule : Module() {
  private fun getMD5HashOfFilePath(uri: URI): String {
    val md = MessageDigest.getInstance("MD5")
    return md.digest(uri.toString().toByteArray()).joinToString("") { "%02x".format(it) }
  }

  private fun getMD5HashOfFileContent(file: File): String? {
    try {
      val md = MessageDigest.getInstance("MD5")
      val fis = FileInputStream(file)
      val dis = DigestInputStream(fis, md)

      while (dis.read() != -1) {
        // Read the file content
      }

      val digest = md.digest()
      fis.close()

      val result = StringBuilder()
      for (b in digest) {
        result.append(String.format("%02x", b))
      }
      return result.toString()
    } catch (e: Exception) {
      e.printStackTrace()
      return null
    }
  }

  private fun downloadAsset(appContext: AppContext, uri: URI, localUrl: File, promise: Promise) {
    if (localUrl.parentFile?.exists() != true) {
      localUrl.mkdirs()
    }

    if (appContext.filePermission?.getPathPermissions(appContext.reactContext, localUrl.parent)?.contains(Permission.WRITE) != true) {
      promise.reject(UnableToDownloadAssetException(uri.toString()))
      return
    }

    try {
      uri.toURL().openStream().use { input ->
        localUrl.outputStream().use { output ->
          input.copyTo(output)
        }
      }
      promise.resolve(Uri.fromFile(localUrl))
    } catch (e: Exception) {
      promise.reject(UnableToDownloadAssetException(uri.toString()))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("AssetModule")

    AsyncFunction("downloadAsync") { uri: URI, md5Hash: String?, type: String, promise: Promise ->
      if (uri.scheme === "file") {
        promise.resolve(uri)
        return@AsyncFunction
      }

      val cacheFileId = md5Hash ?: getMD5HashOfFilePath(uri)
      val cacheDirectory = appContext.cacheDirectory

      val localUrl = File("$cacheDirectory/ExponentAsset-$cacheFileId.$type")

      if (!localUrl.exists()) {
        downloadAsset(appContext, uri, localUrl, promise)
        return@AsyncFunction
      }

      if (md5Hash == null) {
        promise.resolve(Uri.fromFile(localUrl))
        return@AsyncFunction
      }
      if (md5Hash == getMD5HashOfFileContent(localUrl)) {
        promise.resolve(Uri.fromFile(localUrl))
        return@AsyncFunction
      }
      downloadAsset(appContext, uri, localUrl, promise)
    }
  }
}
