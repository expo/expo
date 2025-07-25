package expo.modules.medialibrary.assets

import android.content.Context
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryUtils

fun deleteAssets(context: Context, assetIds: Array<String>): Boolean {
  val selection = "${MediaStore.Images.Media._ID} IN (${assetIds.joinToString(separator = ",")} )"
  val selectionArgs: Array<String>? = null
  MediaLibraryUtils.deleteAssets(context, selection, selectionArgs)
  return true
}
