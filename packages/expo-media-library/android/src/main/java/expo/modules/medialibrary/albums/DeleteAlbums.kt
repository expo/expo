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
    val selection = "${MediaStore.Images.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)} )"
    val selectionArgs = mAlbumIds

    MediaLibraryUtils.deleteAssets(context, selection, selectionArgs, promise)
  }
}
