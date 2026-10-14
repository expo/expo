// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <mutex>
#include <unordered_set>

#include <react/renderer/core/ReactPrimitives.h>

namespace expo {

/**
 Tags of the mounted SwiftUI views that have no UIKit view of their own (`SwiftUIVirtualView`).
 SwiftUI, not Yoga, places those views on the screen, so the Yoga frame origins their shadow
 nodes carry are not where the views were drawn. `ExpoViewShadowNode` reads this registry in the
 `measure()` path to cancel those origins. Keyed by React tag, like `ContentOriginRegistry`.
 */
class SwiftUIVirtualViewsRegistry {
public:
  static void add(facebook::react::Tag tag) {
    std::lock_guard<std::mutex> lock(mutex());
    storage().insert(tag);
  }

  static void remove(facebook::react::Tag tag) {
    std::lock_guard<std::mutex> lock(mutex());
    storage().erase(tag);
  }

  static bool contains(facebook::react::Tag tag) {
    std::lock_guard<std::mutex> lock(mutex());
    return storage().count(tag) > 0;
  }

private:
  static std::mutex &mutex() {
    static std::mutex instance;
    return instance;
  }

  static std::unordered_set<facebook::react::Tag> &storage() {
    static std::unordered_set<facebook::react::Tag> instance;
    return instance;
  }
};

} // namespace expo

#endif // __cplusplus
