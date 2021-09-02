package expo.modules.updates.manifest

import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.updates.manifest.raw.BareRawManifest
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.*

class BareManifest private constructor(
  override val rawManifest: BareRawManifest,
  private val mId: UUID,
  private val mScopeKey: String,
  private val mCommitTime: Date,
  private val mRuntimeVersion: String,
  private val mAssets: JSONArray?
) : Manifest {
  override val serverDefinedHeaders: JSONObject? = null

  override val manifestFilters: JSONObject? = null

  override val updateEntity: UpdateEntity by lazy {
    UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey).apply {
      status = UpdateStatus.EMBEDDED
    }
  }

  override val assetEntityList: List<AssetEntity> by lazy {
    val assetList = mutableListOf<AssetEntity>()

    val bundleKey = "bundle-$mId"
    val bundleAssetEntity = AssetEntity(bundleKey, "js").apply {
      isLaunchAsset = true
      embeddedAssetFilename = EmbeddedLoader.BARE_BUNDLE_FILENAME
    }
    assetList.add(bundleAssetEntity)
    if (mAssets != null && mAssets.length() > 0) {
      for (i in 0 until mAssets.length()) {
        try {
          val assetObject = mAssets.getJSONObject(i)
          val type = assetObject.getString("type")
          val assetEntity = AssetEntity(
            assetObject.getString("packagerHash") + "." + type,
            type
          ).apply {
            resourcesFilename = assetObject.optString("resourcesFilename")
            resourcesFolder = assetObject.optString("resourcesFolder")
          }
          val scales = assetObject.optJSONArray("scales")
          // if there's only one scale we don't to decide later on which one to copy
          // so we avoid this work now
          if (scales != null && scales.length() > 1) {
            assetEntity.scale = assetObject.optDouble("scale").toFloat()
            assetEntity.scales = arrayOfNulls(scales.length())
            for (j in 0 until scales.length()) {
              assetEntity.scales[j] = scales.getDouble(j).toFloat()
            }
          }
          assetList.add(assetEntity)
        } catch (e: JSONException) {
          Log.e(TAG, "Could not read asset from manifest", e)
        }
      }
    }
    assetList
  }

  override val isDevelopmentMode: Boolean = false

  companion object {
    private val TAG = BareManifest::class.java.simpleName

    @Throws(JSONException::class)
    fun fromManifestJson(
      rawManifest: BareRawManifest,
      configuration: UpdatesConfiguration
    ): BareManifest {
      val id = UUID.fromString(rawManifest.getID())
      val commitTime = Date(rawManifest.getCommitTimeLong())
      val runtimeVersion = UpdatesUtils.getRuntimeVersion(configuration)
      val assets = rawManifest.getAssets()
      if (runtimeVersion.contains(",")) {
        throw AssertionError("Should not be initializing a BareManifest in an environment with multiple runtime versions.")
      }
      return BareManifest(
        rawManifest,
        id,
        configuration.scopeKey,
        commitTime,
        runtimeVersion,
        assets
      )
    }
  }
}
