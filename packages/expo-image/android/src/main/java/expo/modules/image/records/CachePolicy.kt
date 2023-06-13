package expo.modules.image.records

import expo.modules.kotlin.types.Enumerable

enum class CachePolicy(val value: String) : Enumerable {
  NONE("none"),
  DISK("disk"),
  MEMORY("memory"),
  MEMORY_AND_DISK("memory-disk")
}
