package expo.modules.updates.manifest

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.manifests.core.Manifest
import org.json.JSONObject

/**
 * Represents the manifest object for an update. Distinct from [UpdateEntity] which represents a
 * (theoretical or actual) row in the SQLite `updates` table.
 */
interface UpdateManifest {
  val updateEntity: UpdateEntity?
  val assetEntityList: List<AssetEntity>
  val manifest: Manifest
  val serverDefinedHeaders: JSONObject?
  val manifestFilters: JSONObject?
  val isDevelopmentMode: Boolean
}
