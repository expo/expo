package expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor
import kotlinx.coroutines.ensureActive
import kotlin.coroutines.coroutineContext

suspend fun deleteAlbums(context: Context, albumIds: List<String>): Boolean {
  val mAlbumIds = albumIds.toTypedArray()
  val selectionImages = "${MediaStore.Images.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)})"
  val selectionVideos = "${MediaStore.Video.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)})"

  MediaLibraryUtils.deleteAssets(context, selectionImages, mAlbumIds)
  coroutineContext.ensureActive()
  MediaLibraryUtils.deleteAssets(context, selectionVideos, mAlbumIds)
  return true
}
