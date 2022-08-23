// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#include "ExpoViewProps.h"
#include "ExpoViewEventEmitter.h"
#include "ExpoViewState.h"

namespace expo {

extern const char ExpoViewComponentName[];

class ExpoViewShadowNode final : public facebook::react::ConcreteViewShadowNode<ExpoViewComponentName, ExpoViewProps, ExpoViewEventEmitter, ExpoViewState> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace expo

#endif // __cplusplus
