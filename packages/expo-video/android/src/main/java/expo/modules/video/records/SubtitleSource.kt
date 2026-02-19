package expo.modules.video.records

import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class SubtitleSource(
  @Field val uri: Uri? = null,
  @Field val language: String? = null,
  @Field val label: String? = null
) : Record, Serializable
