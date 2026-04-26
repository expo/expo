package expo.modules.speech

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

enum class VoiceQuality(val value: String) : Enumerable {
  ENHANCED("Enhanced"),
  DEFAULT("Default")
}

@OptimizedRecord
data class VoiceRecord(
  @Field val identifier: String,
  @Field val name: String,
  @Field val quality: VoiceQuality,
  @Field val language: String
) : Record
