package expo.modules.updates.manifest

import android.net.Uri
import android.util.Log
import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import expo.modules.structuredheaders.BooleanItem
import expo.modules.structuredheaders.NumberItem
import expo.modules.structuredheaders.Parser
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.manifests.core.NewManifest
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.text.ParseException
import java.util.*

class NewUpdateManifest private constructor(
  override val manifest: NewManifest,
  private val mId: UUID,
  private val mScopeKey: String,
  private val mCommitTime: Date,
  private val mRuntimeVersion: String,
  private val mLaunchAsset: JSONObject,
  private val mAssets: JSONArray?,
  private val mExtensions: JSONObject?,
  private val mServerDefinedHeaders: String?,
  private val mManifestFilters: String?
) : UpdateManifest {
  override val serverDefinedHeaders: JSONObject? by lazy {
    if (mServerDefinedHeaders == null) {
      null
    } else headerDictionaryToJSONObject(mServerDefinedHeaders)
  }

  override val manifestFilters: JSONObject? by lazy {
    if (mManifestFilters == null) {
      null
    } else headerDictionaryToJSONObject(mManifestFilters)
  }

  override val updateEntity: UpdateEntity by lazy {
    UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey).apply {
      manifest = this@NewUpdateManifest.manifest.getRawJson()
    }
  }

  private val assetHeaders: Map<String, JSONObject> by lazy {
    val assetRequestHeadersJSON = (mExtensions ?: JSONObject()).getNullable<JSONObject>("assetRequestHeaders")
    assetRequestHeadersJSON?.let { it.keys().asSequence().associateWith { key -> it.require(key) } } ?: mapOf()
  }

  override val assetEntityList: List<AssetEntity> by lazy {
    val assetList = mutableListOf<AssetEntity>()
    try {
      assetList.add(
        AssetEntity(
          mLaunchAsset.getString("key"),
          // the fileExtension is not necessary for the launch asset and EAS servers will not include it.
          mLaunchAsset.getNullable("fileExtension")
        ).apply {
          url = Uri.parse(mLaunchAsset.getString("url"))
          extraRequestHeaders = assetHeaders[mLaunchAsset.getString("key")]
          isLaunchAsset = true
          embeddedAssetFilename = EmbeddedLoader.BUNDLE_FILENAME
        }
      )
    } catch (e: JSONException) {
      Log.e(TAG, "Could not read launch asset from manifest", e)
    }
    if (mAssets != null && mAssets.length() > 0) {
      for (i in 0 until mAssets.length()) {
        try {
          val assetObject = mAssets.getJSONObject(i)
          assetList.add(
            AssetEntity(
              assetObject.getString("key"),
              assetObject.getString("fileExtension")
            ).apply {
              url = Uri.parse(assetObject.getString("url"))
              extraRequestHeaders = assetHeaders[assetObject.getString("key")]
              embeddedAssetFilename = assetObject.getNullable("embeddedAssetFilename")
            }
          )
        } catch (e: JSONException) {
          Log.e(TAG, "Could not read asset from manifest", e)
        }
      }
    }
    assetList
  }

  override val isDevelopmentMode: Boolean = false

  companion object {
    private val TAG = UpdateManifest::class.java.simpleName

    @Throws(JSONException::class)
    fun fromNewManifest(
      manifest: NewManifest,
      manifestHeaderData: ManifestHeaderData,
      extensions: JSONObject?,
      configuration: UpdatesConfiguration
    ): NewUpdateManifest {
      val id = UUID.fromString(manifest.getID())
      val runtimeVersion = manifest.getRuntimeVersion()
      val launchAsset = manifest.getLaunchAsset()
      val assets = manifest.getAssets()
      val commitTime: Date = try {
        UpdatesUtils.parseDateString(manifest.getCreatedAt())
      } catch (e: ParseException) {
        Log.e(TAG, "Could not parse manifest createdAt string; falling back to current time", e)
        Date()
      }
      return NewUpdateManifest(
        manifest,
        id,
        configuration.scopeKey!!,
        commitTime,
        runtimeVersion,
        launchAsset,
        assets,
        extensions,
        manifestHeaderData.serverDefinedHeaders,
        manifestHeaderData.manifestFilters
      )
    }

    internal fun headerDictionaryToJSONObject(headerDictionary: String?): JSONObject? {
      val jsonObject = JSONObject()
      val parser = Parser(headerDictionary)
      try {
        val filtersDictionary = parser.parseDictionary()
        val map = filtersDictionary.get()
        for (key in map.keys) {
          val element = map[key]!!
          // ignore any dictionary entries whose type is not string, number, or boolean
          if (element is StringItem || element is BooleanItem || element is NumberItem<*>) {
            jsonObject.put(key, element.get())
          }
        }
      } catch (e: expo.modules.structuredheaders.ParseException) {
        Log.e(TAG, "Failed to parse manifest header content", e)
        return null
      } catch (e: JSONException) {
        Log.e(TAG, "Failed to parse manifest header content", e)
        return null
      }
      return jsonObject
    }
  }
}
