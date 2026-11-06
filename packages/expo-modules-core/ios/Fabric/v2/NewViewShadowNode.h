// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#include "NewViewEventEmitter.h"
#include "NewViewProps.h"

namespace expo::views {

/**
 The name that `ConcreteViewShadowNode` requires. It isn't the name of any component:
 `NewComponentDescriptor` takes the name and the handle from its flavor.
 */
extern const char placeholderComponentName[];

class NewViewShadowNode final
  : public facebook::react::ConcreteViewShadowNode<placeholderComponentName, NewViewProps, NewViewEventEmitter> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace expo::views

#endif // __cplusplus
