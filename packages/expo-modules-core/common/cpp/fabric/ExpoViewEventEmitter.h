// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewEventEmitter.h>

namespace expo {

class ExpoViewEventEmitter : public facebook::react::ViewEventEmitter {
public:
  using ViewEventEmitter::ViewEventEmitter;
};

} // namespace expo

#endif // __cplusplus
