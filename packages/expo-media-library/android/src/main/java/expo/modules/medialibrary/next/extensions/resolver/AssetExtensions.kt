package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.next.exceptions.AssetCouldNotBeCreated
import expo.modules.medialibrary.next.extensions.getNullableInt
import expo.modules.medialibrary.next.extensions.getNullableLong
import expo.modules.medialibrary.next.extensions.getNullableString
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreAudioAsset
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImageAsset
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideoAsset
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

suspend fun ContentResolver.queryAssetDisplayName(contentUri: Uri): String? =
  queryOne(contentUri, MediaStore.Files.FileColumns.DISPLAY_NAME, Cursor::getNullableString)

suspend fun ContentResolver.queryAssetDateTaken(contentUri: Uri): Long? =
  queryOne(contentUri, MediaStore.Images.ImageColumns.DATE_TAKEN, Cursor::getNullableLong)

suspend fun ContentResolver.queryAssetDateModified(contentUri: Uri): Long? =
  queryOne(contentUri, MediaStore.MediaColumns.DATE_MODIFIED, Cursor::getNullableLong)

suspend fun ContentResolver.queryAssetDuration(contentUri: Uri): Long? =
  queryOne(contentUri, MediaStore.MediaColumns.DURATION, Cursor::getNullableLong)

suspend fun ContentResolver.queryAssetWidth(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.WIDTH, Cursor::getNullableInt)

suspend fun ContentResolver.queryAssetHeight(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.HEIGHT, Cursor::getNullableInt)

suspend fun ContentResolver.queryAssetData(contentUri: Uri): String? =
  queryOne(contentUri, MediaStore.MediaColumns.DATA, Cursor::getNullableString)

suspend fun ContentResolver.queryAssetBucketId(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.BUCKET_ID, Cursor::getNullableInt)

@RequiresApi(Build.VERSION_CODES.Q)
suspend fun ContentResolver.queryAssetIsFavorite(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.IS_FAVORITE, Cursor::getNullableInt)

suspend fun ContentResolver.queryAssetMediaStoreItem(contentUri: Uri): AssetMediaStoreItem? {
  return when (MediaType.fromContentUri(contentUri)) {
    MediaType.IMAGE -> queryMediaStoreImageAsset(contentUri)?.let { AssetMediaStoreItem.Image(it) }
    MediaType.VIDEO -> queryMediaStoreVideoAsset(contentUri)?.let { AssetMediaStoreItem.Video(it) }
    MediaType.AUDIO -> queryMediaStoreAudioAsset(contentUri)?.let { AssetMediaStoreItem.Audio(it) }
    MediaType.UNKNOWN -> null
  }
}

suspend fun ContentResolver.queryMediaStoreImageAsset(contentUri: Uri): MediaStoreImageAsset? =
  querySingleMediaStoreAsset(contentUri, MediaStoreImageAsset.projection) {
    MediaStoreImageAsset.from(this)
  }

suspend fun ContentResolver.queryMediaStoreVideoAsset(contentUri: Uri): MediaStoreVideoAsset? =
  querySingleMediaStoreAsset(contentUri, MediaStoreVideoAsset.projection) {
    MediaStoreVideoAsset.from(this)
  }

suspend fun ContentResolver.queryMediaStoreAudioAsset(contentUri: Uri): MediaStoreAudioAsset? =
  querySingleMediaStoreAsset(contentUri, MediaStoreAudioAsset.projection) {
    MediaStoreAudioAsset.from(this)
  }

private suspend fun <T> ContentResolver.querySingleMediaStoreAsset(
  contentUri: Uri,
  projection: Array<String>,
  fromCursor: Cursor.() -> T
): T? = withContext(Dispatchers.IO) {
  val cursor = safeQuery(contentUri, projection, null, null)
    ?: return@withContext null

  return@withContext cursor.use {
    if (it.moveToFirst()) {
      it.fromCursor()
    } else {
      null
    }
  }
}

suspend fun ContentResolver.insertPendingAsset(
  displayName: String,
  mimeType: MimeType,
  relativePath: RelativePath
): Uri = withContext(Dispatchers.IO) {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
    put(MediaStore.MediaColumns.MIME_TYPE, mimeType.value)
    put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath.value)
    put(MediaStore.MediaColumns.IS_PENDING, 1)
  }
  val collectionUri = mimeType.mediaCollectionUri()
  return@withContext insert(collectionUri, contentValues)
    ?: throw AssetCouldNotBeCreated("Failed to create asset: contentResolver.insert() returned null.")
}

@RequiresApi(Build.VERSION_CODES.Q)
fun ContentResolver.publishPendingAsset(uri: Uri) {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.IS_PENDING, 0)
  }
  safeUpdate(uri, contentValues)
}

fun ContentResolver.safeUpdate(
  uri: Uri,
  values: ContentValues
): Int {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    update(uri, values, null)
  } else {
    update(uri, values, null, null)
  }
}

fun ContentResolver.updateRelativePath(contentUri: Uri, newRelativePath: RelativePath) {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.RELATIVE_PATH, newRelativePath.value)
  }
  update(contentUri, contentValues, null, null)
}

fun ContentResolver.updateRelativePathAndName(
  contentUri: Uri,
  newRelativePath: RelativePath,
  displayName: String
) {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.RELATIVE_PATH, newRelativePath.value)
    put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
  }
  update(contentUri, contentValues, null, null)
}

fun ContentResolver.deleteBy(assetPath: String) {
  delete(
    EXTERNAL_CONTENT_URI,
    "${MediaStore.MediaColumns.DATA}=?",
    arrayOf(assetPath)
  )
}
