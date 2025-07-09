// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#include "ExpoViewEventEmitter.h"
#include "ExpoViewProps.h"
#include "ExpoViewState.h"

namespace expo {

extern const char ExpoViewComponentName[];

class ExpoViewShadowNode final : public facebook::react::ConcreteViewShadowNode<
                                     ExpoViewComponentName, ExpoViewProps,
                                     ExpoViewEventEmitter, ExpoViewState> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ExpoViewShadowNode(const facebook::react::ShadowNodeFragment &fragment,
                     const facebook::react::ShadowNodeFamily::Shared &family,
                     facebook::react::ShadowNodeTraits traits);

  ExpoViewShadowNode(const facebook::react::ShadowNode &sourceShadowNode,
                     const facebook::react::ShadowNodeFragment &fragment);

public:
  static facebook::react::ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    return traits;
  }

private:
  void initialize() noexcept;
};

} // namespace expo

#endif // __cplusplus
