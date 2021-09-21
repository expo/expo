package expo.modules.updates.manifest

import android.net.Uri
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.updates.manifest.raw.LegacyRawManifest
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.net.URI
import java.text.ParseException
import java.util.*

class LegacyManifest private constructor(
  override val rawManifest: LegacyRawManifest,
  private val mManifestUrl: Uri,
  private val mId: UUID,
  private val mScopeKey: String,
  private val mCommitTime: Date,
  private val mRuntimeVersion: String?,
  private val mBundleUrl: Uri,
  private val mAssets: JSONArray?
) : Manifest {
  override val serverDefinedHeaders: JSONObject? = null

  override val manifestFilters: JSONObject? = null

  override val updateEntity: UpdateEntity by lazy {
    UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey).apply {
      manifest = this@LegacyManifest.rawManifest.getRawJson()
      if (isDevelopmentMode) {
        status = UpdateStatus.DEVELOPMENT
      }
    }
  }

  override val assetEntityList: List<AssetEntity> by lazy {
    val assetList = mutableListOf<AssetEntity>()
    val bundleKey = rawManifest.getBundleKey()
    assetList.add(AssetEntity(bundleKey, "js").apply {
      url = mBundleUrl
      isLaunchAsset = true
      embeddedAssetFilename = EmbeddedLoader.BUNDLE_FILENAME
    })

    if (mAssets != null && mAssets.length() > 0) {
      for (i in 0 until mAssets.length()) {
        try {
          val bundledAsset = mAssets.getString(i)
          val extensionIndex = bundledAsset.lastIndexOf('.')
          val prefixLength = "asset_".length
          val hash = if (extensionIndex > 0) bundledAsset.substring(
            prefixLength,
            extensionIndex
          ) else bundledAsset.substring(prefixLength)
          val type = if (extensionIndex > 0) bundledAsset.substring(extensionIndex + 1) else ""
          assetList.add(
            AssetEntity("$hash.$type", type).apply {
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
    getAssetsUrlBase(mManifestUrl, rawManifest)
  }

  override val isDevelopmentMode: Boolean by lazy {
    rawManifest.isDevelopmentMode()
  }

  companion object {
    private val TAG = Manifest::class.java.simpleName

    private const val EXPO_ASSETS_URL_BASE = "https://d1wp6m56sqw74a.cloudfront.net/~assets/"
    private val EXPO_DOMAINS = arrayOf("expo.io", "exp.host", "expo.test")

    @Throws(JSONException::class)
    fun fromLegacyRawManifest(
      rawManifest: LegacyRawManifest,
      configuration: UpdatesConfiguration
    ): LegacyManifest {
      val id: UUID
      val commitTime: Date
      if (rawManifest.isUsingDeveloperTool()) {
        // xdl doesn't always serve a releaseId, but we don't need one in dev mode
        id = UUID.randomUUID()
        commitTime = Date()
      } else {
        id = UUID.fromString(rawManifest.getReleaseId())
        val commitTimeString = rawManifest.getCommitTime()
        commitTime = try {
          UpdatesUtils.parseDateString(commitTimeString)
        } catch (e: ParseException) {
          Log.e(TAG, "Could not parse commitTime", e)
          Date()
        }
      }

      val runtimeVersion = rawManifest.getRuntimeVersion() ?: rawManifest.getSDKVersion()
      val bundleUrl = Uri.parse(rawManifest.getBundleURL())
      val bundledAssets = rawManifest.getBundledAssets()
      return LegacyManifest(
        rawManifest,
        configuration.updateUrl,
        id,
        configuration.scopeKey,
        commitTime,
        runtimeVersion,
        bundleUrl,
        bundledAssets
      )
    }

    internal fun getAssetsUrlBase(manifestUrl: Uri, rawManifest: LegacyRawManifest): Uri {
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
        val assetsPathOrUrl = rawManifest.getAssetUrlOverride() ?: "assets"
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
