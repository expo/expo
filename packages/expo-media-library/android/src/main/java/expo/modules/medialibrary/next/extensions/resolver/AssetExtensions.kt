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
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

suspend fun ContentResolver.queryAssetDisplayName(contentUri: Uri): String? =
  queryOne(contentUri, MediaStore.MediaColumns.DISPLAY_NAME, Cursor::getString)

suspend fun ContentResolver.queryGetCreationTime(contentUri: Uri): Long? =
  queryOne(contentUri, MediaStore.MediaColumns.DATE_TAKEN, Cursor::getLong)

suspend fun ContentResolver.queryAssetModificationTime(contentUri: Uri): Long? =
  queryOne(contentUri, MediaStore.MediaColumns.DATE_MODIFIED, Cursor::getLong)

suspend fun ContentResolver.queryAssetDuration(contentUri: Uri): Long? =
  queryOne(contentUri, MediaStore.Video.VideoColumns.DURATION, Cursor::getLong)

suspend fun ContentResolver.queryAssetWidth(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.WIDTH, Cursor::getInt)

suspend fun ContentResolver.queryAssetHeight(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.HEIGHT, Cursor::getInt)

suspend fun ContentResolver.queryAssetPath(contentUri: Uri): String? =
  queryOne(contentUri, MediaStore.Files.FileColumns.DATA, Cursor::getString)

suspend fun ContentResolver.queryAssetBucketId(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.MediaColumns.BUCKET_ID, Cursor::getInt)

suspend fun ContentResolver.queryAssetMediaType(contentUri: Uri): Int? =
  queryOne(contentUri, MediaStore.Files.FileColumns.MEDIA_TYPE, Cursor::getInt)

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

fun ContentResolver.deleteBy(assetPath: String) {
  delete(
    EXTERNAL_CONTENT_URI,
    "${MediaStore.MediaColumns.DATA}=?",
    arrayOf(assetPath)
  )
}
