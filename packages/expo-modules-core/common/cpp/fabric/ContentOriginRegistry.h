// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <mutex>
#include <optional>
#include <unordered_map>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/graphics/Point.h>

namespace expo {

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
