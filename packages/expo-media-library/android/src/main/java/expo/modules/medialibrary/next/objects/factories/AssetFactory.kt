package expo.modules.medialibrary.next.objects.factories

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.webkit.MimeTypeMap
import androidx.annotation.RequiresApi
import androidx.core.net.toUri
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.writeFileContentsToAsset
import expo.modules.medialibrary.next.objects.Asset
import java.io.File

class AssetFactory(val context: Context) {
  private val contentResolver
    get() = context.contentResolver ?: throw ReactContextLost()

  fun create(filePath: String, relativePath: String?): Asset {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      createAsset(filePath, relativePath)
    } else {
      createAssetLegacy(filePath)
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun createAsset(filePath: String, relativePath: String? = null): Asset {
    val (normalizedFilePath, mimeType, displayName) = extractDataFromFilePath(filePath)
    val relativePath = relativePath ?: getRelativePathForAssetType(mimeType, true)
    val contentUri = contentResolver.insertPendingAsset(displayName, mimeType, relativePath)
    contentResolver.writeFileContentsToAsset(File(normalizedFilePath.path!!), contentUri)
    contentResolver.publishPendingAsset(contentUri)
    return Asset(ContentUris.parseId(contentUri), context)
  }

  private fun extractDataFromFilePath(filePath: String): Triple<Uri, String?, String> {
    val normalizedFilePath = normalizeAssetUri(filePath)
    val mimeType = contentResolver.getType(normalizedFilePath) ?: getMimeTypeFromFileUrl(normalizedFilePath.toString())
    val displayName = normalizedFilePath.lastPathSegment ?: ""
    return Triple(normalizedFilePath, mimeType, displayName)
  }

  private fun getMimeTypeFromFileUrl(url: String): String? {
    val extension = MimeTypeMap.getFileExtensionFromUrl(url) ?: return null
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
  }

  private fun createAssetLegacy(filePath: String): Asset {
    TODO()
  }

  fun getRelativePathForAssetType(mimeType: String?, useCameraDir: Boolean): String {
    if (mimeType?.contains("image") == true || mimeType?.contains("video") == true) {
      return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
    } else if (mimeType?.contains("audio") == true) {
      return Environment.DIRECTORY_MUSIC
    }
    // For backward compatibility
    return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
  }

  // "/storage/emulated/0/photo.jpg"  -> file:///storage/emulated/0/photo.jpg
  private fun normalizeAssetUri(uri: String): Uri {
    return if (uri.startsWith("/")) {
      Uri.fromFile(File(uri))
    } else {
      uri.toUri()
    }
  }
}
