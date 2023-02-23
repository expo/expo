package abi48_0_0.expo.modules.medialibrary.assets

import android.content.Context
import android.os.Bundle
import abi48_0_0.expo.modules.kotlin.Promise
import abi48_0_0.expo.modules.medialibrary.ASSET_PROJECTION
import abi48_0_0.expo.modules.medialibrary.AssetQueryException
import abi48_0_0.expo.modules.medialibrary.AssetsOptions
import abi48_0_0.expo.modules.medialibrary.ERROR_NO_PERMISSIONS
import abi48_0_0.expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import abi48_0_0.expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import abi48_0_0.expo.modules.medialibrary.EXTERNAL_CONTENT_URI
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
