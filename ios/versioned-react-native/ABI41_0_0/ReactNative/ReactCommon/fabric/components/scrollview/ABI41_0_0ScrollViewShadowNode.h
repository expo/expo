/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/scrollview/ScrollViewEventEmitter.h>
#include <ABI41_0_0React/components/scrollview/ScrollViewProps.h>
#include <ABI41_0_0React/components/scrollview/ScrollViewState.h>
#include <ABI41_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI41_0_0React/core/LayoutContext.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

extern const char ScrollViewComponentName[];

/*
 * `ShadowNode` for <ScrollView> component.
 */
class ScrollViewShadowNode final : public ConcreteViewShadowNode<
                                       ScrollViewComponentName,
                                       ScrollViewProps,
                                       ScrollViewEventEmitter,
                                       ScrollViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Transform getTransform() const override;

 private:
  void updateStateIfNeeded();
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
