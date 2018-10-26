/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0components/root/RootProps.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/ConcreteViewShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutContext.h>

namespace facebook {
namespace ReactABI31_0_0 {

class RootShadowNode;

using SharedRootShadowNode = std::shared_ptr<const RootShadowNode>;
using UnsharedRootShadowNode = std::shared_ptr<RootShadowNode>;

extern const char RootComponentName[];

/*
 * `ShadowNode` for the root component.
 * Besides all functionality of the `View` component, `RootShadowNode` contains
 * props which represent external layout constraints and context of the
 * shadow tree.
 */
class RootShadowNode final:
  public ConcreteViewShadowNode<
    RootComponentName,
    RootProps
  > {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  /*
   * Layouts the shadow tree.
   */
  void layout();

private:

  using YogaLayoutableShadowNode::layout;
};

} // namespace ReactABI31_0_0
} // namespace facebook
