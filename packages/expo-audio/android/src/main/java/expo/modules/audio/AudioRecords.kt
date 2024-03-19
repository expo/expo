package expo.modules.audio

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AudioSource(
  @Field val uri: String? = null
) : Record