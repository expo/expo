#pragma once

#include "../ExpoHeader.pch"
#include "ExpoViewState.h"

#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace react = facebook::react;
namespace jni = facebook::jni;

namespace expo {

class AndroidExpoViewState : public ExpoViewState {
public:
  using ExpoViewState::ExpoViewState;

  // Declaring the merge constructor below suppresses the implicit default
  // constructor, and `using` never inherits a base default constructor. We need
  // a no-arg constructor for the synchronous size updates (see
  // NativeStatePropsGetter::update*Immediate), so request one explicitly.
  AndroidExpoViewState() = default;

  AndroidExpoViewState(
    AndroidExpoViewState const &previousState,
    folly::dynamic data
  );

  ~AndroidExpoViewState() override;

  folly::dynamic getDynamic() const;

  facebook::react::MapBuffer getMapBuffer() const;

  static inline bool isNonnullProperty(const folly::dynamic &value, const std::string &name) {
    return value.count(name) && !value[name].isNull();
  }

  mutable jni::global_ref<jni::JMap<jstring, jobject>> statePropsDiff;
};

} // namespace expo
