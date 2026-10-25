// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <mutex>
#include <optional>
#include <unordered_map>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/graphics/Point.h>

namespace expo {

/**
 Where the native layout system drew a view's contents, keyed by React tag.

 This sits outside the shadow tree on purpose. `ExpoViewState` would be the idiomatic home, but a
 state update enqueues a commit, and the origin changes on every native layout pass — a commit per
 pass can re-run layout, move the origin, and commit again. Writing here schedules no work.
 */
class ContentOriginRegistry {
public:
  static void set(facebook::react::Tag tag, facebook::react::Point origin) {
    std::lock_guard<std::mutex> lock(mutex());
    storage()[tag] = origin;
  }

  static void clear(facebook::react::Tag tag) {
    std::lock_guard<std::mutex> lock(mutex());
    storage().erase(tag);
  }

  static void clearAll() {
    std::lock_guard<std::mutex> lock(mutex());
    storage().clear();
  }

  static std::optional<facebook::react::Point> find(facebook::react::Tag tag) {
    std::lock_guard<std::mutex> lock(mutex());
    auto it = storage().find(tag);
    if (it == storage().end()) {
      return std::nullopt;
    }
    return it->second;
  }

private:
  static std::mutex &mutex() {
    static std::mutex instance;
    return instance;
  }

  static std::unordered_map<facebook::react::Tag, facebook::react::Point> &storage() {
    static std::unordered_map<facebook::react::Tag, facebook::react::Point> instance;
    return instance;
  }
};

} // namespace expo

#endif // __cplusplus
