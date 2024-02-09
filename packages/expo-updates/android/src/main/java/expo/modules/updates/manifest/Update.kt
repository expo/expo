package expo.modules.updates.manifest

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.manifests.core.Manifest

/**
 * Represents the manifest object for an update. Distinct from [UpdateEntity] which represents a
 * (theoretical or actual) row in the SQLite `updates` table.
 */
interface Update {
  val updateEntity: UpdateEntity?
  val assetEntityList: List<AssetEntity>
  val manifest: Manifest
  val isDevelopmentMode: Boolean
}
