package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.core.net.toUri
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.queryAssetData
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class MediaStoreToAssetAdapter(context: Context) {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  suspend fun transformHeight(mediaStoreHeight: Int?, contentUri: Uri): Int? {
    return transformDimension(mediaStoreHeight, contentUri) {
      downloadBitmapAndGet(contentUri) { it.outHeight }
    }
  }

  suspend fun transformWidth(mediaStoreWidth: Int?, contentUri: Uri): Int? {
    return transformDimension(mediaStoreWidth, contentUri) {
      downloadBitmapAndGet(contentUri) { it.outWidth }
    }
  }

  private suspend fun transformDimension(
    mediaStoreDimension: Int?,
    contentUri: Uri,
    fallback: suspend () -> Int?
  ): Int? {
    val isImage = MediaType.fromContentUri(contentUri) == MediaType.IMAGE
    return when {
      isImage && (mediaStoreDimension == null || mediaStoreDimension <= 0) -> fallback()
      mediaStoreDimension != null && mediaStoreDimension > 0 -> mediaStoreDimension
      else -> null
    }
  }

  private suspend fun downloadBitmapAndGet(
    contentUri: Uri,
    extract: (BitmapFactory.Options) -> Int
  ): Int = withContext(Dispatchers.IO) {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    val path = contentResolver.queryAssetData(contentUri)
    BitmapFactory.decodeFile(path, options)
    return@withContext extract(options)
  }

  fun transformCreationTime(mediaStoreDateTaken: Long?): Long? =
    mediaStoreDateTaken.takeIf { it != 0L }

  fun transformDuration(mediaStoreDuration: Long?): Long? =
    mediaStoreDuration.takeIf { it != 0L }

  fun transformModificationTime(mediaStoreDateModified: Long?): Long? =
    mediaStoreDateModified
      ?.takeIf { it != 0L }
      ?.toDuration(DurationUnit.SECONDS)
      ?.inWholeMilliseconds

  fun transformUri(mediaStoreData: String?): Uri? =
    mediaStoreData?.let { File(it).toUri() }
}
