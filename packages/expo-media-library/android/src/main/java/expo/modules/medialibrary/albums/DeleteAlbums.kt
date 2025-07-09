package expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor

internal class DeleteAlbums(
  private val context: Context,
  albumIds: List<String>,
  private val promise: Promise
) {
  private val mAlbumIds = albumIds.toTypedArray()

  fun execute() {
    val selectionImages = "${MediaStore.Images.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)})"
    val selectionVideos = "${MediaStore.Video.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)})"
    val selectionArgs = mAlbumIds

    // We need to run delete for images and videos separately, but resolve the promise only once
    val promiseOverride = object : Promise {
      override fun resolve(value: Any?) {
        MediaLibraryUtils.deleteAssets(context, selectionVideos, selectionArgs, promise)
      }

      override fun reject(code: String, message: String?, cause: Throwable?) {
        promise.reject(code, message, cause)
      }
    }

    // Delete Images
    MediaLibraryUtils.deleteAssets(context, selectionImages, selectionArgs, promiseOverride)
  }
}
