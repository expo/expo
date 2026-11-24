// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <optional>

#include <jsi/jsi.h>
#include <react/renderer/core/RawProps.h>

namespace expo::views {

/**
 The props object behind a `RawProps` in JSI mode, and the runtime it belongs to.
 Valid only during the `cloneProps` call that got the `RawProps`, on the thread of that call.
 */
struct JSIRawProps {
  facebook::jsi::Runtime &runtime;
  const facebook::jsi::Value &value;
};

/**
 Returns the whole props object of `rawProps` when it is in JSI mode, or `std::nullopt` when it is
 empty or built from `folly::dynamic`.

 `RawProps` keeps the object private. Its public `forEachItem` gives one prop at a time, which copies
 each name and value and costs more when the decoder reads the object itself.
 */
std::optional<JSIRawProps> jsiRawProps(const facebook::react::RawProps &rawProps);

} // namespace expo::views

#endif // __cplusplus
