package expo.modules.updates.manifest

import android.net.Uri
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.manifests.core.LegacyManifest
import org.json.JSONArray
import org.json.JSONException
import java.net.URI
import java.text.ParseException
import java.util.*

/**
 * Class for manifests that use the classic format (i.e. come from Expo's classic updates service or
 * a self-hosted service following the classic updates format, such as one making use of `expo-cli
 * export`).
 *
 * Asset URLs are relative in this format, and we assume that if no base URL is explicitly provided,
 * the base URL is Expo's classic asset CDN.
 */
class LegacyUpdateManifest private constructor(
  override val manifest: LegacyManifest,
  private val mManifestUrl: Uri,
  private val mId: UUID,
  private val mScopeKey: String,
  private val mCommitTime: Date,
  private val mRuntimeVersion: String,
  private val mBundleUrl: Uri,
  private val mAssets: JSONArray?
) : UpdateManifest {
  override val updateEntity: UpdateEntity by lazy {
    UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey, this@LegacyUpdateManifest.manifest.getRawJson()).apply {
      if (isDevelopmentMode) {
        status = UpdateStatus.DEVELOPMENT
      }
    }
  }

  override val assetEntityList: List<AssetEntity> by lazy {
    val assetList = mutableListOf<AssetEntity>()
    val bundleKey = manifest.getBundleKey()
    assetList.add(
      AssetEntity(bundleKey, "js").apply {
        url = mBundleUrl
        isLaunchAsset = true
        embeddedAssetFilename = EmbeddedLoader.BUNDLE_FILENAME
      }
    )

    if (mAssets != null && mAssets.length() > 0) {
      for (i in 0 until mAssets.length()) {
        try {
          val bundledAsset = mAssets.getString(i)
          val extensionIndex = bundledAsset.lastIndexOf('.')
          val prefixLength = "asset_".length
          val hash = if (extensionIndex > 0) {
            bundledAsset.substring(
              prefixLength,
              extensionIndex
            )
          } else {
            bundledAsset.substring(prefixLength)
          }
          val type = if (extensionIndex > 0) bundledAsset.substring(extensionIndex + 1) else ""
          assetList.add(
            AssetEntity(hash, type).apply {
              url = Uri.withAppendedPath(assetsUrlBase, hash)
              embeddedAssetFilename = bundledAsset
            }
          )
        } catch (e: JSONException) {
          Log.e(TAG, "Could not read asset from manifest", e)
        }
      }
    }
    assetList
  }

  private val assetsUrlBase: Uri? by lazy {
    getAssetsUrlBase(mManifestUrl, manifest)
  }

  override val isDevelopmentMode: Boolean by lazy {
    manifest.isDevelopmentMode()
  }

  companion object {
    private val TAG = UpdateManifest::class.java.simpleName

    private const val EXPO_ASSETS_URL_BASE = "https://classic-assets.eascdn.net/~assets/"
    private val EXPO_DOMAINS = arrayOf("expo.io", "exp.host", "expo.test")

    @Throws(JSONException::class)
    fun fromLegacyManifest(
      manifest: LegacyManifest,
      configuration: UpdatesConfiguration
    ): LegacyUpdateManifest {
      val id: UUID
      val commitTime: Date
      if (manifest.isUsingDeveloperTool()) {
        // xdl doesn't always serve a releaseId, but we don't need one in dev mode
        id = UUID.randomUUID()
        commitTime = Date()
      } else {
        id = UUID.fromString(manifest.getReleaseId())
        commitTime = try {
          val commitTimeString = manifest.getCommitTime() ?: throw JSONException("missing commitTime")
          UpdatesUtils.parseDateString(commitTimeString)
        } catch (e: ParseException) {
          Log.e(TAG, "Could not parse commitTime", e)
          Date()
        }
      }

      val runtimeVersion = manifest.getRuntimeVersion() ?: manifest.getExpoGoSDKVersion() ?: throw Exception("sdkVersion should not be null")
      val bundleUrl = Uri.parse(manifest.getBundleURL())
      val bundledAssets = manifest.getBundledAssets()
      return LegacyUpdateManifest(
        manifest,
        configuration.updateUrl,
        id,
        configuration.scopeKey,
        commitTime,
        runtimeVersion,
        bundleUrl,
        bundledAssets
      )
    }

    internal fun getAssetsUrlBase(manifestUrl: Uri, legacyManifest: LegacyManifest): Uri {
      val hostname = manifestUrl.host
      return if (hostname == null) {
        Uri.parse(EXPO_ASSETS_URL_BASE)
      } else {
        for (expoDomain in EXPO_DOMAINS) {
          if (hostname == expoDomain || hostname.endsWith(".$expoDomain")) {
            return Uri.parse(EXPO_ASSETS_URL_BASE)
          }
        }

        // assetUrlOverride may be an absolute or relative URL
        // if relative, we should resolve with respect to the manifest URL
        // java.net.URI's resolve method does this for us
        val assetsPathOrUrl = legacyManifest.getAssetUrlOverride() ?: "assets"
        try {
          val assetsURI = URI(assetsPathOrUrl)
          val manifestURI = URI(manifestUrl.toString())
          Uri.parse(manifestURI.resolve(assetsURI).toString())
        } catch (e: Exception) {
          Log.e(TAG, "Failed to parse assetUrlOverride, falling back to default asset path", e)
          manifestUrl.buildUpon().appendPath("assets").build()
        }
      }
    }
  }
}
