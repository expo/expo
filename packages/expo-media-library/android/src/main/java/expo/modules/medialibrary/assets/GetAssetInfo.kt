package expo.modules.medialibrary.assets

import android.content.Context
import android.os.Bundle
import android.provider.MediaStore

suspend fun getAssetInfo(context: Context, assetId: String): ArrayList<Bundle>? {
  val selection = "${MediaStore.Images.Media._ID}=?"
  val selectionArgs = arrayOf(assetId)
  return queryAssetInfo(context, selection, selectionArgs, true)
}
