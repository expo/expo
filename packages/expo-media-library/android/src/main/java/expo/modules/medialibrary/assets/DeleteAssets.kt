package expo.modules.medialibrary.assets

import android.content.Context
import android.os.AsyncTask
import android.provider.MediaStore
import expo.modules.core.Promise
import expo.modules.medialibrary.MediaLibraryUtils

internal class DeleteAssets(
  private val context: Context,
  private val assetIds: Array<String>,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  override fun doInBackground(vararg params: Void?): Void? {
    val selection = "${MediaStore.Images.Media._ID} IN (${assetIds.joinToString(separator = ",")} )"
    val selectionArgs: Array<String>? = null

    MediaLibraryUtils.deleteAssets(context, selection, selectionArgs, promise)
    return null
  }
}
