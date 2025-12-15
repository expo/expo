package expo.modules.medialibrary.assets

import android.content.Context
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryUtils

suspend fun deleteAssets(context: Context, assetIds: Array<String>): Boolean {
  val selection = "${MediaStore.Images.Media._ID} IN (${assetIds.joinToString(separator = ",")} )"
  val selectionArgs: Array<String>? = null

  return MediaLibraryUtils.deleteAssets(context, selection, selectionArgs)
}
