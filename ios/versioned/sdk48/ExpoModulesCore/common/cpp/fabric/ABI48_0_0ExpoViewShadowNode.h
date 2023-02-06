// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#include "ExpoViewProps.h"
#include "ExpoViewEventEmitter.h"
#include "ExpoViewState.h"

namespace ABI48_0_0expo {

extern const char ExpoViewComponentName[];

class ExpoViewShadowNode final : public ABI48_0_0facebook::ABI48_0_0React::ConcreteViewShadowNode<ExpoViewComponentName, ExpoViewProps, ExpoViewEventEmitter, ExpoViewState> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace ABI48_0_0expo

#endif // __cplusplus
