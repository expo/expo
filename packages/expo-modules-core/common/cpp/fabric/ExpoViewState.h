// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <limits>

namespace expo {

class ExpoViewState {
public:
  ExpoViewState() = default;

  virtual ~ExpoViewState() = default;
  
  ExpoViewState(float width, float height);
  
  static ExpoViewState withStyleDimensions(float styleWidth, float styleHeight);

  float _width = std::numeric_limits<float>::quiet_NaN();
  float _height = std::numeric_limits<float>::quiet_NaN();
  float _styleWidth = std::numeric_limits<float>::quiet_NaN();
  float _styleHeight = std::numeric_limits<float>::quiet_NaN();
};

} // namespace expo

#endif // __cplusplus
