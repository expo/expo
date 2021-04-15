package expo.modules.updates.manifest

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject
import java.util.*

interface Manifest {
  val updateEntity: UpdateEntity?
  val assetEntityList: List<AssetEntity?>?
  val rawManifestJson: JSONObject?
  val serverDefinedHeaders: JSONObject?
  val manifestFilters: JSONObject?
  val isDevelopmentMode: Boolean
}
