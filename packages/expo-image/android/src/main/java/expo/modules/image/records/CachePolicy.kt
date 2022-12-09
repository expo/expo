package expo.modules.image.records

import expo.modules.kotlin.records.Record

enum class CachePolicy(val value: String) : Record {
  NONE("none"),
  DISK("disk"),
  MEMORY("memory"),
  MEMORY_AND_DISK("memoryAndDisk")
}
