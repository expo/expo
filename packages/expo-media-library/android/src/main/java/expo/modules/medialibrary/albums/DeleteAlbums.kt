package expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor

internal class DeleteAlbums(
  private val context: Context,
  albumIds: List<String>
) {
  private val mAlbumIds = albumIds.toTypedArray()

  fun execute(): Boolean {
    val selectionImages = "${MediaStore.Images.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)})"
    val selectionVideos = "${MediaStore.Video.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)})"
    val selectionArgs = mAlbumIds

    MediaLibraryUtils.deleteAssets(context, selectionImages, selectionArgs)
    MediaLibraryUtils.deleteAssets(context, selectionVideos, selectionArgs)
    return true
  }
}
