/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/view/ConcreteViewShadowNode.h>
#include <ReactABI34_0_0/components/view/ViewProps.h>

namespace facebook {
namespace ReactABI34_0_0 {

extern const char ViewComponentName[];

/*
 * `ShadowNode` for <View> component.
 */
class ViewShadowNode final : public ConcreteViewShadowNode<
                                 ViewComponentName,
                                 ViewProps,
                                 ViewEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  bool isLayoutOnly() const;
};

} // namespace ReactABI34_0_0
} // namespace facebook
