package abi49_0_0.expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore
import abi49_0_0.expo.modules.kotlin.Promise
import abi49_0_0.expo.modules.medialibrary.MediaLibraryUtils
import abi49_0_0.expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor

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
