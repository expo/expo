package expo.modules.medialibrary.next.observers

import android.content.ContentResolver
import android.database.ContentObserver
import android.net.Uri
import android.os.Handler
import android.provider.MediaStore
import expo.modules.medialibrary.next.extensions.resolver.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.next.extensions.resolver.safeQuery
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MediaStoreContentObserver(
  handler: Handler,
  private val mediaType: MediaType,
  private val onChange: OnMediaLibraryChange,
  private val observerScope: CoroutineScope,
  private val contentResolver: ContentResolver
) : ContentObserver(handler) {
  // The API should only notify about insertions and deletions, not metadata updates.
  // On iOS, PHPhotoLibraryChangeObserver distinguishes change types natively.
  // On Android, ContentObserver only tells us "something changed" — so we track
  // the sum of asset IDs to detect actual insertions/deletions while ignoring metadata edits.
  // The sum is used instead of a count to avoid race conditions (sum always differs because IDs are incremental)
  private var assetsIdSum = 0L

  override fun onChange(selfChange: Boolean) {
    this.onChange(selfChange, null)
  }

  override fun onChange(selfChange: Boolean, uri: Uri?) {
    observerScope.launch {
      val newAssetsIdSum = getAssetsIdSum(mediaType)
      if (newAssetsIdSum != assetsIdSum) {
        assetsIdSum = newAssetsIdSum
        onChange.invoke()
      }
    }
  }

  private suspend fun getAssetsIdSum(mediaType: MediaType): Long = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = EXTERNAL_CONTENT_URI,
      projection = arrayOf(MediaStore.Files.FileColumns._ID),
      selection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} == ${mediaType.toMediaStoreValue()}"
    ).use { cursor ->
      ensureActive()
      if (cursor == null) {
        return@use 0
      }
      var idSum = 0L
      while (cursor.moveToNext()) {
        idSum += cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID))
      }
      return@use idSum
    }
  }
}
