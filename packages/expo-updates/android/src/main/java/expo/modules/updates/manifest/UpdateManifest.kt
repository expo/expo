package expo.modules.updates.manifest

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.manifests.core.Manifest
import org.json.JSONObject

interface UpdateManifest {
  val updateEntity: UpdateEntity?
  val assetEntityList: List<AssetEntity>
  val manifest: Manifest
  val serverDefinedHeaders: JSONObject?
  val manifestFilters: JSONObject?
  val isDevelopmentMode: Boolean
}
