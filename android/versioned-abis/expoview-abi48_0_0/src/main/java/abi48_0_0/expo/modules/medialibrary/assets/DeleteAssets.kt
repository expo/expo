package abi48_0_0.expo.modules.medialibrary.assets

import android.content.Context
import android.provider.MediaStore
import abi48_0_0.expo.modules.kotlin.Promise
import abi48_0_0.expo.modules.medialibrary.MediaLibraryUtils

internal class DeleteAssets(
  private val context: Context,
  private val assetIds: Array<String>,
  private val promise: Promise
) {
  fun execute() {
    val selection = "${MediaStore.Images.Media._ID} IN (${assetIds.joinToString(separator = ",")} )"
    val selectionArgs: Array<String>? = null

    MediaLibraryUtils.deleteAssets(context, selection, selectionArgs, promise)
  }
}
