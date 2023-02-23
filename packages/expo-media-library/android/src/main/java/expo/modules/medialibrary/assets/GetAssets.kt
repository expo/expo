package expo.modules.medialibrary.assets

import android.content.Context
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.ASSET_PROJECTION
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.ERROR_NO_PERMISSIONS
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import java.io.IOException

internal class GetAssets(
  private val context: Context,
  private val assetOptions: AssetsOptions,
  private val promise: Promise
) {
  fun execute() {
    val contentResolver = context.contentResolver
    try {
      val (selection, order, limit, offset) = getQueryFromOptions(assetOptions)
      contentResolver.query(
        EXTERNAL_CONTENT_URI,
        ASSET_PROJECTION,
        selection,
        null,
        order
      ).use { assetsCursor ->
        if (assetsCursor == null) {
          throw AssetQueryException()
        }

        val assetsInfo = ArrayList<Bundle>()
        putAssetsInfo(
          contentResolver,
          assetsCursor,
          assetsInfo,
          limit.toInt(),
          offset,
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
      promise.reject(
        ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e
      )
    } catch (e: IOException) {
      promise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file", e)
    } catch (e: IllegalArgumentException) {
      promise.reject(ERROR_UNABLE_TO_LOAD, e.message ?: "Invalid MediaType", e)
    } catch (e: UnsupportedOperationException) {
      e.printStackTrace()
      promise.reject(ERROR_NO_PERMISSIONS, e.message, e)
    }
  }
}
