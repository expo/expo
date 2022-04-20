/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0RootShadowNode.h"

#include <ABI45_0_0React/ABI45_0_0renderer/components/view/conversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/SystraceSection.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

const char RootComponentName[] = "RootView";

bool RootShadowNode::layoutIfNeeded(
    std::vector<LayoutableShadowNode const *> *affectedNodes) {
  SystraceSection s("RootShadowNode::layout");

  if (getIsLayoutClean()) {
    return false;
  }

  ensureUnsealed();

  auto layoutContext = getConcreteProps().layoutContext;
  layoutContext.affectedNodes = affectedNodes;

  layoutTree(layoutContext, getConcreteProps().layoutConstraints);

  return true;
}

Transform RootShadowNode::getTransform() const {
  auto viewportOffset = getConcreteProps().layoutContext.viewportOffset;
  return Transform::Translate(viewportOffset.x, viewportOffset.y, 0);
}

RootShadowNode::Unshared RootShadowNode::clone(
    PropsParserContext const &propsParserContext,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const {
  auto props = std::make_shared<RootProps const>(
      propsParserContext, getConcreteProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode = std::make_shared<RootShadowNode>(
      *this,
      ShadowNodeFragment{
          /* .props = */ props,
      });

  if (layoutConstraints != getConcreteProps().layoutConstraints) {
    newRootShadowNode->dirtyLayout();
  }

  return newRootShadowNode;
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
