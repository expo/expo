// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace expo {

class ExpoViewState final {
public:
  ExpoViewState() {};

#ifdef ANDROID
  ExpoViewState(ExpoViewState const &previousState, folly::dynamic data) {};

  folly::dynamic getDynamic() const {
    return {};
  };

  facebook::react::MapBuffer getMapBuffer() const {
    return facebook::react::MapBufferBuilder::EMPTY();
  };
#endif

};

} // namespace expo

#endif // __cplusplus
