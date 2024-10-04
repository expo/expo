/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>
#include <mutex>
#include <optional>

#include <folly/container/EvictingCacheMap.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Simple thread-safe LRU cache.
 */
template <typename KeyT, typename ValueT, int maxSize>
class SimpleThreadSafeCache {
 public:
  SimpleThreadSafeCache() : map_{maxSize} {}
  SimpleThreadSafeCache(unsigned long size) : map_{size} {}

  /*
   * Returns a value from the map with a given key.
   * If the value wasn't found in the cache, constructs the value using given
   * generator function, stores it inside a cache and returns it.
   * Can be called from any thread.
   */
  ValueT get(const KeyT &key, std::function<ValueT(const KeyT &key)> generator)
      const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto iterator = map_.find(key);
    if (iterator == map_.end()) {
      auto value = generator(key);
      map_.set(key, value);
      return value;
    }

    return iterator->second;
  }

  /*
   * Returns a value from the map with a given key.
   * If the value wasn't found in the cache, returns empty optional.
   * Can be called from any thread.
   */
  std::optional<ValueT> get(const KeyT &key) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto iterator = map_.find(key);
    if (iterator == map_.end()) {
      return {};
    }

    return iterator->second;
  }

  /*
   * Sets a key-value pair in the LRU cache.
   * Can be called from any thread.
   */
  void set(const KeyT &key, const ValueT &value) const {
    std::lock_guard<std::mutex> lock(mutex_);
    map_.set(std::move(key), std::move(value));
  }

 private:
  mutable folly::EvictingCacheMap<KeyT, ValueT> map_;
  mutable std::mutex mutex_;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
