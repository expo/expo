/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/scrollview/ScrollViewEventEmitter.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/scrollview/ScrollViewProps.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/scrollview/ScrollViewState.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutContext.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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
  Point getContentOriginOffset() const override;

 private:
  void updateStateIfNeeded();
  void updateScrollContentOffsetIfNeeded();
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
