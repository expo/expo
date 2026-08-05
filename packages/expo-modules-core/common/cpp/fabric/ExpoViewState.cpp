#include "ExpoViewState.h"

#ifdef __cplusplus

namespace expo {

ExpoViewState::ExpoViewState(float width, float height) {
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
}

ExpoViewState ExpoViewState::withStyleDimensions(float styleWidth, float styleHeight) {
  ExpoViewState state;
  if (styleWidth >= 0) {
    state._styleWidth = styleWidth;
  } else {
    state._styleWidth = std::numeric_limits<float>::quiet_NaN();
  }
  if (styleHeight >= 0) {
    state._styleHeight = styleHeight;
  } else {
    state._styleHeight = std::numeric_limits<float>::quiet_NaN();
  }
  return state;
}

} // namespace expo

#endif // __cplusplus
