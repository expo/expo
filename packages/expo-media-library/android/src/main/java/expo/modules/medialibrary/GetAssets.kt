package expo.modules.medialibrary

import android.os.AsyncTask
import android.os.Bundle
import android.content.Context
import expo.modules.core.Promise
import expo.modules.medialibrary.MediaLibraryConstants.*
import java.io.IOException
import java.util.ArrayList

internal class GetAssets(
    private val context: Context,
    private val assetOptions: Map<String, Any>,
    private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  public override fun doInBackground(vararg params: Void?): Void? {
    val queryInfo = GetQueryInfo(assetOptions).invoke()
    val contentResolver = context.contentResolver
    try {
      contentResolver.query(
          EXTERNAL_CONTENT,
          ASSET_PROJECTION,
          queryInfo.selection,
          null,
          queryInfo.order
      ).use { assetsCursor ->
        if (assetsCursor == null) {
          promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get assets. Query returns null.")
          return null
        }

          val assetsInfo = ArrayList<Bundle>()
          MediaLibraryUtils.putAssetsInfo(
              contentResolver,
              assetsCursor,
              assetsInfo,
              queryInfo.limit,
              queryInfo.offset,
              false
          )
          val response = Bundle().apply {
            putParcelableArrayList("assets", assetsInfo)
            putBoolean("hasNextPage", !assetsCursor.isAfterLast)
            putString("endCursor", assetsCursor.position.toString())
            putInt("totalCount", assetsCursor.count)
          }
          promise.resolve(response)

      }
    } catch (e: SecurityException) {
      promise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e)
    } catch (e: IOException) {
      promise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file", e)
    } catch (e: UnsupportedOperationException) {
      e.printStackTrace();
      promise.reject(ERROR_NO_PERMISSIONS, e.message);
    }
    return null
  }
}
