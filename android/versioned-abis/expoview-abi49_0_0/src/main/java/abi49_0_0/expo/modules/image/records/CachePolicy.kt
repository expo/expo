package abi49_0_0.expo.modules.image.records

import abi49_0_0.expo.modules.kotlin.types.Enumerable

enum class CachePolicy(val value: String) : Enumerable {
  NONE("none"),
  DISK("disk"),
  MEMORY("memory"),
  MEMORY_AND_DISK("memory-disk")
}
