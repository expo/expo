package expo.modules.updates.manifest

import android.net.Uri
import android.util.Log
import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.db.enums.UpdateStatus
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.text.ParseException
import java.util.*

/**
 * Class for manifests using the modern format defined in the Expo Updates specification
 * (https://docs.expo.dev/technical-specs/expo-updates-1/). This is used by EAS Update.
 */
class ExpoUpdatesUpdate private constructor(
  override val manifest: ExpoUpdatesManifest,
  private val id: UUID,
  private val scopeKey: String,
  private val commitTime: Date,
  private val runtimeVersion: String,
  private val launchAsset: JSONObject,
  private val assets: JSONArray?,
  private val extensions: JSONObject?
) : Update {
  override val updateEntity: UpdateEntity by lazy {
    UpdateEntity(id, commitTime, runtimeVersion, scopeKey, this@ExpoUpdatesUpdate.manifest.getRawJson()).apply {
      if (isDevelopmentMode) {
        status = UpdateStatus.DEVELOPMENT
      }
    }
  }

  private val assetHeaders: Map<String, JSONObject> by lazy {
    val assetRequestHeadersJSON = (extensions ?: JSONObject()).getNullable<JSONObject>("assetRequestHeaders")
    assetRequestHeadersJSON?.let { it.keys().asSequence().associateWith { key -> it.require(key) } } ?: mapOf()
  }

  override val assetEntityList: List<AssetEntity> by lazy {
    val assetList = mutableListOf<AssetEntity>()
    try {
      assetList.add(
        AssetEntity(
          launchAsset.getString("key"),
          // the fileExtension is not necessary for the launch asset and EAS servers will not include it.
          launchAsset.getNullable("fileExtension")
        ).apply {
          url = Uri.parse(launchAsset.getString("url"))
          extraRequestHeaders = assetHeaders[launchAsset.getString("key")]
          isLaunchAsset = true
          embeddedAssetFilename = EmbeddedLoader.BUNDLE_FILENAME
          expectedHash = launchAsset.getNullable("hash")
        }
      )
    } catch (e: JSONException) {
      Log.e(TAG, "Could not read launch asset from manifest", e)
    }
    if (assets != null && assets.length() > 0) {
      for (i in 0 until assets.length()) {
        try {
          val assetObject = assets.getJSONObject(i)
          assetList.add(
            AssetEntity(
              assetObject.getString("key"),
              assetObject.getString("fileExtension")
            ).apply {
              url = Uri.parse(assetObject.getString("url"))
              extraRequestHeaders = assetHeaders[assetObject.getString("key")]
              embeddedAssetFilename = assetObject.getNullable("embeddedAssetFilename")
              expectedHash = assetObject.getNullable("hash")
            }
          )
        } catch (e: JSONException) {
          Log.e(TAG, "Could not read asset from manifest", e)
        }
      }
    }
    assetList
  }

  override val isDevelopmentMode: Boolean by lazy {
    manifest.isDevelopmentMode()
  }

  companion object {
    private val TAG = Update::class.java.simpleName

    @Throws(JSONException::class)
    fun fromExpoUpdatesManifest(
      manifest: ExpoUpdatesManifest,
      extensions: JSONObject?,
      configuration: UpdatesConfiguration
    ): ExpoUpdatesUpdate = ExpoUpdatesUpdate(
      manifest,
      id = UUID.fromString(manifest.getID()),
      configuration.scopeKey,
      commitTime = try {
        UpdatesUtils.parseDateString(manifest.getCreatedAt())
      } catch (e: ParseException) {
        Log.e(TAG, "Could not parse manifest createdAt string; falling back to current time", e)
        Date()
      },
      runtimeVersion = manifest.getRuntimeVersion(),
      launchAsset = manifest.getLaunchAsset(),
      assets = manifest.getAssets(),
      extensions
    )
  }
}
