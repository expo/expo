// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <memory>

namespace expo {

/**
 Carries a weak reference to the Expo `AppContext` (as an opaque Objective-C object)
 so it can be stored in React Native's per-host `ContextContainer` and read back inside
 the `ExpoViewProps` constructor on the JavaScript thread.

 The actual weak storage lives in an Objective-C box (`ExpoAppContextBox`) implemented in
 `ExpoViewPropsDecoder.mm`, because ARC's `__weak` is not available in the pure-C++
 translation units under `common/cpp`. This header therefore only forward-declares the box
 and exposes a copyable handle (a `shared_ptr` to the box) that is safe to store in the
 `ContextContainer`. The reference is weak so a torn-down app context doesn't leak or
 dangle; readers must null-check before use.
 */

// Opaque, defined in ExpoViewPropsDecoder.mm.
class ExpoAppContextBox;

class ExpoAppContextHolder {
public:
  static constexpr const char *kContextContainerKey = "expo.appContext";

  ExpoAppContextHolder() = default;
  explicit ExpoAppContextHolder(std::shared_ptr<ExpoAppContextBox> box) : _box(std::move(box)) {}

  const std::shared_ptr<ExpoAppContextBox> &box() const {
    return _box;
  }

private:
  std::shared_ptr<ExpoAppContextBox> _box;
};

} // namespace expo

#endif // __cplusplus
