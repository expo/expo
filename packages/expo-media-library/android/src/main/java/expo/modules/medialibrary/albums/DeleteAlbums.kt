package expo.modules.medialibrary.albums

import android.content.Context
import android.os.AsyncTask
import android.provider.MediaStore
import expo.modules.core.Promise
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor

internal class DeleteAlbums(
  private val context: Context,
  albumIds: List<String>,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  private val mAlbumIds = albumIds.toTypedArray()

  override fun doInBackground(vararg voids: Void?): Void? {
    val selection = "${MediaStore.Images.Media.BUCKET_ID} IN (${queryPlaceholdersFor(mAlbumIds)} )"
    val selectionArgs = mAlbumIds

    MediaLibraryUtils.deleteAssets(context, selection, selectionArgs, promise)
    return null
  }
}
