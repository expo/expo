#pragma once

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

class JSI_EXPORT RNCAndroidDialogPickerState final {
 public:
  using Shared = std::shared_ptr<const RNCAndroidDialogPickerState>;

  RNCAndroidDialogPickerState() : measuredHeight(-1){};
  RNCAndroidDialogPickerState(int measuredHeight_)
      : measuredHeight(measuredHeight_){};

#ifdef ANDROID
  RNCAndroidDialogPickerState(
      RNCAndroidDialogPickerState const& previousState,
      folly::dynamic data)
      : measuredHeight((Float)data["measuredHeight"].getDouble()){};
#endif

  const float measuredHeight;

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };

#endif

#pragma mark - Getters
};

} // namespace facebook::react
