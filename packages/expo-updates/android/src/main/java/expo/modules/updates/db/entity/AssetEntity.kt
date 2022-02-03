package expo.modules.updates.db.entity

import android.net.Uri
import androidx.room.*
import expo.modules.updates.db.enums.HashType
import org.json.JSONObject
import java.util.*

@Entity(tableName = "assets", indices = [Index(value = ["key"], unique = true)])
class AssetEntity(@field:ColumnInfo(name = "key") var key: String?, var type: String?) {
  @PrimaryKey(autoGenerate = true) // 0 is treated as unset while inserting the entity into the db
  var id: Long = 0

  var url: Uri? = null

  var headers: JSONObject? = null

  @ColumnInfo(name = "extra_request_headers")
  var extraRequestHeaders: JSONObject? = null

  var metadata: JSONObject? = null

  @ColumnInfo(name = "download_time")
  var downloadTime: Date? = null

  @ColumnInfo(name = "relative_path")
  var relativePath: String? = null

  /**
   * Hex-encoded SHA-256
   */
  var hash: ByteArray? = null

  @ColumnInfo(name = "hash_type")
  var hashType = HashType.SHA256

  /**
   * Base64URL-encoded SHA-256
   */
  @ColumnInfo(name = "expected_hash")
  var expectedHash: String? = null

  @ColumnInfo(name = "marked_for_deletion")
  var markedForDeletion = false

  @Ignore
  var isLaunchAsset = false

  @Ignore
  var embeddedAssetFilename: String? = null

  @Ignore
  var resourcesFilename: String? = null

  @Ignore
  var resourcesFolder: String? = null

  @Ignore
  var scale: Float? = null

  @Ignore
  var scales: Array<Float>? = null
}
