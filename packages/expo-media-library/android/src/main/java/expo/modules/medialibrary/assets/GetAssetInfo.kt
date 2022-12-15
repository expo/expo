package expo.modules.medialibrary.assets

import android.content.Context
import android.provider.MediaStore
import expo.modules.kotlin.Promise

internal class GetAssetInfo(
  private val context: Context,
  private val assetId: String,
  private val promise: Promise
) {
  fun execute() {
    val selection = "${MediaStore.Images.Media._ID}=?"
    val selectionArgs = arrayOf(assetId)

    queryAssetInfo(context, selection, selectionArgs, true, promise)
  }
}
