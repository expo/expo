package expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore.Images.Media
import expo.modules.medialibrary.MediaLibraryUtils

suspend fun removeAssetsFromAlbum(context: Context, assetIds: Array<String>, albumId: String) {
  val bucketSelection = "${Media.BUCKET_ID}=? AND ${Media._ID} IN (${assetIds.joinToString(",")} )"
  val bucketId = arrayOf(albumId)
  MediaLibraryUtils.deleteAssets(context, bucketSelection, bucketId)
}
