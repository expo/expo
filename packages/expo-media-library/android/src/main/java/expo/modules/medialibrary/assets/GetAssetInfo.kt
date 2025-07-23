package expo.modules.medialibrary.assets

import android.content.Context
import android.os.Bundle
import android.provider.MediaStore

internal class GetAssetInfo(
  private val context: Context,
  private val assetId: String
) {
  fun execute(): ArrayList<Bundle>? {
    val selection = "${MediaStore.Images.Media._ID}=?"
    val selectionArgs = arrayOf(assetId)

    return queryAssetInfo(context, selection, selectionArgs, true)
  }
}
