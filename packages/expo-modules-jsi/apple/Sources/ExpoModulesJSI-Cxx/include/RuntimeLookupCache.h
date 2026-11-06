// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <atomic>
#include <cstdint>

namespace expo {

/**
 The runtime that `JavaScriptRuntime.for(unsafePointer:)` found last on the current thread: the
 address of the `jsi::Runtime`, the unretained `JavaScriptRuntimeHandle` and the generation of the
 registry when it was found.
 */
struct RuntimeLookupCacheEntry {
  const void *_Nullable runtimeAddress = nullptr;
  const void *_Nullable handle = nullptr;
  uint64_t generation = 0;
};

/**
 The storage of the registry's generation.
 */
inline std::atomic<uint64_t> &runtimeRegistryGeneration() noexcept {
  static std::atomic<uint64_t> generation{0};
  return generation;
}

/**
 Returns the registry's generation, which changes whenever a runtime is added to or removed from the
 registry. While it stays the same, the registry still holds the handle in a cache entry of that
 generation.
 */
inline uint64_t currentRuntimeRegistryGeneration() noexcept {
  return runtimeRegistryGeneration().load(std::memory_order_acquire);
}

/**
 Changes the registry's generation. The registry calls it whenever it adds or removes a runtime.
 */
inline void advanceRuntimeRegistryGeneration() noexcept {
  runtimeRegistryGeneration().fetch_add(1, std::memory_order_acq_rel);
}

/**
 Returns the cache entry of the current thread.
 */
inline RuntimeLookupCacheEntry *_Nonnull currentThreadRuntimeLookupCache() noexcept {
  thread_local RuntimeLookupCacheEntry entry;
  return &entry;
}

} // namespace expo

#endif // __cplusplus
