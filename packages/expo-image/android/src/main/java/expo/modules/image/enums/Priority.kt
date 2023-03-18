package expo.modules.image.enums

import expo.modules.kotlin.types.Enumerable

enum class Priority(val value: String) : Enumerable {
  LOW("low"),
  NORMAL("normal"),
  HIGH("high");

  internal fun toGlidePriority(): com.bumptech.glide.Priority = when (this) {
    LOW -> com.bumptech.glide.Priority.LOW
    NORMAL -> com.bumptech.glide.Priority.NORMAL
    HIGH -> com.bumptech.glide.Priority.IMMEDIATE
  }
}
