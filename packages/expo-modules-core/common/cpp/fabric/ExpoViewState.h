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
  ExpoViewState() {}
  
  ExpoViewState(float width, float height) {
    if (width >= 0) {
      _width = width;
    } else {
      _width = std::numeric_limits<float>::quiet_NaN();
    }
    if (height >= 0) {
      _height = height;
    } else {
      _height = std::numeric_limits<float>::quiet_NaN();
    }
  };

#ifdef ANDROID
  ExpoViewState(ExpoViewState const &previousState, folly::dynamic data)
  : _width((float)data["width"].getDouble()),
    _height((float)data["height"].getDouble()){};
  folly::dynamic getDynamic() const {
    return {};
  };

  facebook::react::MapBuffer getMapBuffer() const {
    return facebook::react::MapBufferBuilder::EMPTY();
  };
#endif
  
  float _width = std::numeric_limits<float>::quiet_NaN();
  float _height = std::numeric_limits<float>::quiet_NaN();

};

} // namespace expo

#endif // __cplusplus
