package expo.modules.medialibrary.assets

import android.content.Context
import android.os.Bundle
import expo.modules.medialibrary.ASSET_PROJECTION
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.PermissionsException
import expo.modules.medialibrary.UnableToLoadException
import kotlinx.coroutines.ensureActive
import java.io.IOException
import kotlin.coroutines.coroutineContext

suspend fun getAssets(context: Context, assetOptions: AssetsOptions): Bundle {
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
      coroutineContext.ensureActive()
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
        assetOptions.resolveWithFullInfo ?: false
      )
      return Bundle().apply {
        putParcelableArrayList("assets", assetsInfo)
        putBoolean("hasNextPage", !assetsCursor.isAfterLast)
        putString("endCursor", assetsCursor.position.toString())
        putInt("totalCount", assetsCursor.count)
      }
    }
  } catch (e: Exception) {
    throw when (e) {
      is SecurityException -> UnableToLoadException("Could not get asset: need read_external_storage permission", e)
      is IOException -> UnableToLoadException("Could not read file: ${e.message}", e)
      is IllegalArgumentException -> UnableToLoadException(e.message ?: "Invalid MediaType ${e.message}", e)
      is UnsupportedOperationException -> PermissionsException(e.message ?: "Permission denied: ${e.message}")
      else -> e
    }
  }
}
