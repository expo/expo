package expo.modules.medialibrary.assets

import android.content.Context
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryUtils

internal class DeleteAssets(
  private val context: Context,
  private val assetIds: Array<String>
) {
  fun execute(): Boolean {
    val selection = "${MediaStore.Images.Media._ID} IN (${assetIds.joinToString(separator = ",")} )"
    val selectionArgs: Array<String>? = null

    MediaLibraryUtils.deleteAssets(context, selection, selectionArgs)
    return true
  }
}
