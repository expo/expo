package expo.modules.image.enums

import expo.modules.kotlin.records.Record

enum class Priority(val value: String) : Record {
  LOW("low"),
  NORMAL("normal"),
  HIGH("high");

  internal fun toGlidePriority(): com.bumptech.glide.Priority = when (this) {
    LOW -> com.bumptech.glide.Priority.LOW
    NORMAL -> com.bumptech.glide.Priority.NORMAL
    HIGH -> com.bumptech.glide.Priority.IMMEDIATE
  }
}
