package abi47_0_0.expo.modules.medialibrary.albums

import android.content.Context
import android.os.AsyncTask
import android.provider.MediaStore.MediaColumns
import android.provider.MediaStore.Files.FileColumns

import abi47_0_0.expo.modules.core.Promise

internal class GetAlbum(
  private val context: Context,
  private val albumName: String,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  public override fun doInBackground(vararg params: Void?): Void? {
    val selection = "${FileColumns.MEDIA_TYPE} != ${FileColumns.MEDIA_TYPE_NONE}" +
      " AND ${MediaColumns.BUCKET_DISPLAY_NAME}=?"
    val selectionArgs = arrayOf(albumName)

    queryAlbum(context, selection, selectionArgs, promise)
    return null
  }
}
