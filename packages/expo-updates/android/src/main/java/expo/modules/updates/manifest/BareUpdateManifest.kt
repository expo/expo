package expo.modules.updates.manifest

import android.util.Log
import expo.modules.jsonutils.getNullable
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.manifests.core.BareManifest
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.*

class BareUpdateManifest private constructor(
  override val manifest: BareManifest,
  private val mId: UUID,
  private val mScopeKey: String,
  private val mCommitTime: Date,
  private val mRuntimeVersion: String,
  private val mAssets: JSONArray?
) : UpdateManifest {
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
            assetObject.getString("packagerHash"),
            type
          ).apply {
            resourcesFilename = assetObject.getNullable("resourcesFilename")
            resourcesFolder = assetObject.getNullable("resourcesFolder")
          }
          val scales = assetObject.getNullable<JSONArray>("scales")
          // if there's only one scale we don't to decide later on which one to copy
          // so we avoid this work now
          if (scales != null && scales.length() > 1) {
            assetEntity.scale = assetObject.optDouble("scale").toFloat()
            val scalesTemp = Array(scales.length()) { 0f }
            for (j in 0 until scales.length()) {
              scalesTemp[j] = scales.getDouble(j).toFloat()
            }
            assetEntity.scales = scalesTemp
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
    private val TAG = BareUpdateManifest::class.java.simpleName

    @Throws(JSONException::class)
    fun fromBareManifest(
      manifest: BareManifest,
      configuration: UpdatesConfiguration
    ): BareUpdateManifest {
      val id = UUID.fromString(manifest.getID())
      val commitTime = Date(manifest.getCommitTimeLong())
      val runtimeVersion = UpdatesUtils.getRuntimeVersion(configuration)
      val assets = manifest.getAssets()
      if (runtimeVersion.contains(",")) {
        throw AssertionError("Should not be initializing a BareManifest in an environment with multiple runtime versions.")
      }
      return BareUpdateManifest(
        manifest,
        id,
        configuration.scopeKey!!,
        commitTime,
        runtimeVersion,
        assets
      )
    }
  }
}
