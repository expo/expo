/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/scrollview/ScrollViewEventEmitter.h>
#include <ReactABI34_0_0/components/scrollview/ScrollViewProps.h>
#include <ReactABI34_0_0/components/view/ConcreteViewShadowNode.h>
#include <ReactABI34_0_0/core/LayoutContext.h>

namespace facebook {
namespace ReactABI34_0_0 {

extern const char ScrollViewComponentName[];

/*
 * `ShadowNode` for <ScrollView> component.
 */
class ScrollViewShadowNode final : public ConcreteViewShadowNode<
                                       ScrollViewComponentName,
                                       ScrollViewProps,
                                       ScrollViewEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  void updateLocalData();
};

} // namespace ReactABI34_0_0
} // namespace facebook
