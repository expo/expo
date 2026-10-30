package expo.modules.updates.loader

import java.io.IOException

data class AssetLoadFailure(val assetKey: String?, val error: Exception)

/**
 * Thrown when one or more assets of an update fail to load, and carries all of the failures.
 * Remote loads log a warning for each failed asset download. Its cause is the first failure.
 */
class AssetsFailedToLoadException(val failures: List<AssetLoadFailure>) : IOException(
  message(failures),
  failures.firstOrNull()?.error
) {
  companion object {
    private const val MAX_LISTED_ASSET_KEYS = 5

    private fun message(failures: List<AssetLoadFailure>): String {
      val assetKeys = failures.map { it.assetKey ?: "(no key)" }
      val listedKeys = assetKeys.take(MAX_LISTED_ASSET_KEYS).joinToString()
      val moreKeys = if (assetKeys.size > MAX_LISTED_ASSET_KEYS) {
        ", and ${assetKeys.size - MAX_LISTED_ASSET_KEYS} more"
      } else {
        ""
      }
      val assets = if (failures.size == 1) {
        "asset"
      } else {
        "assets"
      }
      return "Failed to load ${failures.size} $assets ($listedKeys$moreKeys)"
    }
  }
}
