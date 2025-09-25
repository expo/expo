package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import android.graphics.BitmapFactory
import androidx.exifinterface.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import androidx.core.net.toUri
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDuration
import expo.modules.medialibrary.next.extensions.resolver.queryAssetHeight
import expo.modules.medialibrary.next.extensions.resolver.queryAssetModificationTime
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.extensions.resolver.queryAssetWidth
import expo.modules.medialibrary.next.extensions.resolver.queryAssetCreationTime
import expo.modules.medialibrary.next.extensions.resolver.updateRelativePath
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.asset.EXIF_TAGS
import expo.modules.medialibrary.next.objects.asset.deleters.AssetDeleter
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import expo.modules.medialibrary.next.records.Location
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference
import kotlin.collections.component1
import kotlin.collections.component2
import kotlin.let
import kotlin.time.DurationUnit
import kotlin.time.toDuration

@RequiresApi(Build.VERSION_CODES.Q)
class AssetModernDelegate(
  override val contentUri: Uri,
  val assetDeleter: AssetDeleter,
  context: Context
) : AssetDelegate {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  override suspend fun getCreationTime(): Long? {
    return contentResolver
      .queryAssetCreationTime(contentUri)
      .takeIf { it != 0L }
  }

  override suspend fun getDuration(): Long? {
    return if (getMimeType().isVideo()) {
      contentResolver
        .queryAssetDuration(contentUri)
        .takeIf { it != 0L }
    } else {
      null
    }
  }

  override suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

  override suspend fun getHeight(): Int {
    val height = contentResolver.queryAssetHeight(contentUri)
      ?: throw AssetPropertyNotFoundException("Height")
    // If height is not saved to the database
    if (getMediaType() == MediaType.IMAGE && height <= 0) {
      return downloadBitmapAndGet { it.outHeight }
    }
    return height
  }

  override suspend fun getWidth(): Int {
    val width = contentResolver.queryAssetWidth(contentUri)
      ?: throw AssetPropertyNotFoundException("Width")
    if (getMediaType() == MediaType.IMAGE && width <= 0) {
      return downloadBitmapAndGet { it.outWidth }
    }
    return width
  }

  private suspend fun downloadBitmapAndGet(extract: (BitmapFactory.Options) -> Int): Int {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    val stringAssetUri = contentResolver.queryAssetPath(contentUri)
    BitmapFactory.decodeFile(stringAssetUri, options)
    return extract(options)
  }

  override suspend fun getMediaType(): MediaType =
    MediaType.fromContentUri(contentUri)

  override suspend fun getModificationTime(): Long? =
    contentResolver.queryAssetModificationTime(contentUri)
      ?.takeIf { it != 0L }
      ?.toDuration(DurationUnit.SECONDS)
      ?.inWholeMilliseconds

  override suspend fun getUri(): Uri {
    // e.g. storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")
    // e.g. file:///storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val uri = File(path).toUri()
    return uri
  }

  override suspend fun getMimeType(): MimeType {
    return contentResolver.getType(contentUri)?.let { MimeType(it) }
      ?: MimeType.from(getUri())
  }

  override suspend fun getLocation(): Location? =
    contentResolver.openInputStream(contentUri)?.use { stream ->
      ExifInterface(stream)
        .latLong
        ?.let { (lat, long) -> Location(lat, long) }
    }

  override suspend fun getExif(): Bundle {
    if (getMediaType() != MediaType.IMAGE) {
      return Bundle()
    }
    val exifMap = Bundle()
    contentResolver.openInputStream(contentUri)?.use { stream ->
      val exifInterface = ExifInterface(stream)
      for ((type, name) in EXIF_TAGS) {
        if (exifInterface.getAttribute(name) != null) {
          when (type) {
            "string" -> exifMap.putString(name, exifInterface.getAttribute(name))
            "int" -> exifMap.putInt(name, exifInterface.getAttributeInt(name, 0))
            "double" -> exifMap.putDouble(name, exifInterface.getAttributeDouble(name, 0.0))
          }
        }
      }
    }
    return exifMap
  }

  override suspend fun delete() = withContext(Dispatchers.IO) {
    assetDeleter.delete(contentUri)
  }

  override suspend fun move(relativePath: RelativePath) {
    contentResolver.updateRelativePath(contentUri, relativePath)
  }

  override suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    val newAssetUri = contentResolver.insertPendingAsset(getFilename(), getMimeType(), relativePath)
    contentResolver.copyUriContent(contentUri, newAssetUri)
    contentResolver.publishPendingAsset(newAssetUri)
    val newAssetDelegate = AssetModernDelegate(newAssetUri, assetDeleter, contextRef.getOrThrow())
    return@withContext Asset(newAssetDelegate)
  }
}
