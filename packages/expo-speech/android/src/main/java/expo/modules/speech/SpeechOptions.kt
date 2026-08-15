package expo.modules.speech

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class SpeechOptions(
  @Field val language: String?,
  @Field val pitch: Float?,
  @Field val rate: Float?,
  @Field val voice: String?,
  @Field val volume: Float?
) : Record
