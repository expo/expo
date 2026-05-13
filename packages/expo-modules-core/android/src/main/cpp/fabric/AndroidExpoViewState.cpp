#include "AndroidExpoViewState.h"

namespace expo {

AndroidExpoViewState::AndroidExpoViewState(
  AndroidExpoViewState const &previousState,
  folly::dynamic data
) {
  this->_width = isNonnullProperty(data, "width") ? (float) data["width"].getDouble()
    : std::numeric_limits<float>::quiet_NaN();
  this->_height = isNonnullProperty(data, "height") ? (float) data["height"].getDouble()
    : std::numeric_limits<float>::quiet_NaN();
  this->_styleWidth = isNonnullProperty(data, "styleWidth") ? (float) data["styleWidth"].getDouble()
    : std::numeric_limits<float>::quiet_NaN();
  this->_styleHeight = isNonnullProperty(data, "styleHeight")
    ? (float) data["styleHeight"].getDouble()
    : std::numeric_limits<float>::quiet_NaN();
}

folly::dynamic AndroidExpoViewState::getDynamic() const {
  return {};
}

facebook::react::MapBuffer AndroidExpoViewState::getMapBuffer() const {
  return facebook::react::MapBufferBuilder::EMPTY();
}

AndroidExpoViewState::~AndroidExpoViewState() {
  if (statePropsDiff != nullptr) {
    jni::ThreadScope::WithClassLoader([this] {
      jni::Environment::current()->DeleteGlobalRef(statePropsDiff.release());
    });
  }
}

} // namespace expo
