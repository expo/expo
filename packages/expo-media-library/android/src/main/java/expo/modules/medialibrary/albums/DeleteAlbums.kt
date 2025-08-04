package expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor

suspend fun deleteAlbums(context: Context, albumIds: Array<String>): Boolean {
  val selectionImages = "${MediaStore.Images.Media.BUCKET_ID} IN (${queryPlaceholdersFor(albumIds)})"
  val selectionVideos = "${MediaStore.Video.Media.BUCKET_ID} IN (${queryPlaceholdersFor(albumIds)})"

  return MediaLibraryUtils.deleteAssets(context, selectionImages, albumIds) &&
    MediaLibraryUtils.deleteAssets(context, selectionVideos, albumIds)
}
