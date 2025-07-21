package expo.modules.medialibrary.assets

import android.content.Context
import android.os.Bundle
import expo.modules.medialibrary.ASSET_PROJECTION
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.MediaLibraryUtils.ensureActiveOrThrow
import expo.modules.medialibrary.PermissionsException
import expo.modules.medialibrary.UnableToLoadException
import java.io.IOException
import kotlin.coroutines.coroutineContext

internal class GetAssets(
  private val context: Context,
  private val assetOptions: AssetsOptions
) {
  suspend fun execute(): Bundle {
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
        coroutineContext.ensureActiveOrThrow()
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
      when (e) {
        is SecurityException -> throw UnableToLoadException("Could not get asset: need read_external_storage permission")
        is IOException -> throw UnableToLoadException("Could not read file $e")
        is IllegalArgumentException -> throw UnableToLoadException(
          e.message
            ?: "Invalid MediaType $e"
        )
        is UnsupportedOperationException -> {
          throw PermissionsException(e.message ?: "Permission denied $e")
        }
        else -> throw e
      }
    }
  }
}
