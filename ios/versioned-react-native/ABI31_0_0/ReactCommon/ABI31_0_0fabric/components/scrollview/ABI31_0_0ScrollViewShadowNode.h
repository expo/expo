/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/scrollview/ScrollViewEventEmitter.h>
#include <ABI31_0_0fabric/ABI31_0_0components/scrollview/ScrollViewProps.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/ConcreteViewShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutContext.h>

namespace facebook {
namespace ReactABI31_0_0 {

extern const char ScrollViewComponentName[];

/*
 * `ShadowNode` for <ScrollView> component.
 */
class ScrollViewShadowNode final:
  public ConcreteViewShadowNode<
    ScrollViewComponentName,
    ScrollViewProps,
    ScrollViewEventEmitter
  > {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

private:

  void updateLocalData();
};

} // namespace ReactABI31_0_0
} // namespace facebook
