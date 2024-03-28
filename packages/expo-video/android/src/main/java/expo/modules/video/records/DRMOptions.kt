package expo.modules.video.records

import androidx.media3.common.MediaItem
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.enums.DRMType
import java.io.Serializable

class DRMOptions(
  @Field var type: DRMType = DRMType.WIDEVINE,
  @Field var licenseServer: String? = null,
  @Field var headers: Map<String, String>? = null,
  @Field var multiKey: Boolean = false
) : Record, Serializable {

  fun toDRMConfiguration() = MediaItem
    .DrmConfiguration
    .Builder(type.toUUID())
    .apply {
      licenseServer?.let { setLicenseUri(it) }
      headers?.let { setLicenseRequestHeaders(it) }
      setMultiSession(multiKey)
    }
    .build()
}
