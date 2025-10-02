package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import androidx.exifinterface.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDuration
import expo.modules.medialibrary.next.extensions.resolver.queryAssetHeight
import expo.modules.medialibrary.next.extensions.resolver.queryAssetWidth
import expo.modules.medialibrary.next.extensions.resolver.queryAssetData
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDateModified
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDateTaken
import expo.modules.medialibrary.next.extensions.resolver.queryAssetMediaStoreItem
import expo.modules.medialibrary.next.extensions.resolver.updateRelativePath
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.asset.EXIF_TAGS
import expo.modules.medialibrary.next.objects.asset.deleters.AssetDeleter
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate
import expo.modules.medialibrary.next.records.AssetInfo
import expo.modules.medialibrary.next.records.Location
import expo.modules.medialibrary.next.records.Shape
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference
import kotlin.collections.component1
import kotlin.collections.component2
import kotlin.let

@RequiresApi(Build.VERSION_CODES.Q)
class AssetModernDelegate(
  override val contentUri: Uri,
  val assetDeleter: AssetDeleter,
  val mediaStorePermissionsDelegate: MediaStorePermissionsDelegate,
  context: Context
) : AssetDelegate {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  private val mediaStoreToAssetAdapter by lazy {
    MediaStoreToAssetAdapter(contextRef.getOrThrow())
  }

  override suspend fun getCreationTime(): Long? {
    val mediaStoreDateTaken = contentResolver.queryAssetDateTaken(contentUri)
    return mediaStoreToAssetAdapter.transformCreationTime(mediaStoreDateTaken)
  }

  override suspend fun getDuration(): Long? {
    if (getMediaType() != MediaType.VIDEO) {
      return null
    }
    val mediaStoreDuration = contentResolver.queryAssetDuration(contentUri)
    return mediaStoreToAssetAdapter.transformDuration(mediaStoreDuration)
  }

  override suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

  override suspend fun getHeight(): Int {
    val mediaStoreHeight = contentResolver.queryAssetHeight(contentUri)
    return mediaStoreToAssetAdapter.transformHeight(mediaStoreHeight, contentUri)
      ?: throw AssetPropertyNotFoundException("Height")
  }

  override suspend fun getWidth(): Int {
    val mediaStoreWidth = contentResolver.queryAssetWidth(contentUri)
    return mediaStoreToAssetAdapter.transformWidth(mediaStoreWidth, contentUri)
      ?: throw AssetPropertyNotFoundException("Width")
  }

  override suspend fun getShape(): Shape? {
    val width = getWidth()
    val height = getHeight()
    return Shape(width, height).takeIf { width > 0 && height > 0 }
  }

  override suspend fun getMediaType(): MediaType =
    MediaType.fromContentUri(contentUri)

  override suspend fun getModificationTime(): Long? {
    val mediaStoreDateModified = contentResolver.queryAssetDateModified(contentUri)
    return mediaStoreToAssetAdapter.transformModificationTime(mediaStoreDateModified)
  }

  override suspend fun getUri(): Uri {
    // e.g. storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val mediaStoreData = contentResolver.queryAssetData(contentUri)
    // e.g. file:///storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    return mediaStoreToAssetAdapter.transformUri(mediaStoreData)
      ?: throw AssetPropertyNotFoundException("Uri")
  }

  override suspend fun getInfo(): AssetInfo {
    val mediaStoreItem = contentResolver.queryAssetMediaStoreItem(contentUri)
      ?: throw AssetPropertyNotFoundException("Info")
    val mediaType = getMediaType()
    val height = mediaStoreToAssetAdapter.transformHeight(mediaStoreItem.height, contentUri)
    val width = mediaStoreToAssetAdapter.transformWidth(mediaStoreItem.width, contentUri)
    return AssetInfo(
      id = contentUri,
      mediaType = mediaType,
      creationTime = mediaStoreToAssetAdapter.transformCreationTime(mediaStoreItem.dateTaken),
      modificationTime = mediaStoreToAssetAdapter.transformModificationTime(mediaStoreItem.dateModified),
      duration = mediaStoreToAssetAdapter.transformDuration(mediaStoreItem.duration),
      filename = mediaStoreItem.displayName
        ?: throw AssetPropertyNotFoundException("Filename"),
      height = height
        ?: throw AssetPropertyNotFoundException("Height"),
      width = width
        ?: throw AssetPropertyNotFoundException("Width"),
      uri = mediaStoreToAssetAdapter.transformUri(mediaStoreItem.data)
        ?: throw AssetPropertyNotFoundException("Uri")
    )
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

  override suspend fun getExif(): Bundle = withContext(Dispatchers.IO) {
    if (getMediaType() != MediaType.IMAGE) {
      return@withContext Bundle()
    }
    val exifBundle = Bundle()
    contentResolver.openInputStream(contentUri)?.use { stream ->
      ensureActive()
      val exifInterface = ExifInterface(stream)
      for ((type, name) in EXIF_TAGS) {
        if (exifInterface.getAttribute(name) != null) {
          when (type) {
            "string" -> exifBundle.putString(name, exifInterface.getAttribute(name))
            "int" -> exifBundle.putInt(name, exifInterface.getAttributeInt(name, 0))
            "double" -> exifBundle.putDouble(name, exifInterface.getAttributeDouble(name, 0.0))
          }
        }
      }
    }
    return@withContext exifBundle
  }

  override suspend fun delete() = withContext(Dispatchers.IO) {
    assetDeleter.delete(contentUri)
  }

  override suspend fun move(relativePath: RelativePath) {
    mediaStorePermissionsDelegate.requestMediaLibraryWritePermission(listOf(contentUri))
    contentResolver.updateRelativePath(contentUri, relativePath)
  }

  override suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    val newAssetUri = contentResolver.insertPendingAsset(getFilename(), getMimeType(), relativePath)
    contentResolver.copyUriContent(contentUri, newAssetUri)
    contentResolver.publishPendingAsset(newAssetUri)
    val newAssetDelegate = AssetModernDelegate(newAssetUri, assetDeleter, mediaStorePermissionsDelegate, contextRef.getOrThrow())
    return@withContext Asset(newAssetDelegate)
  }
}
