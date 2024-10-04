/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI42_0_0React/components/root/RootProps.h>
#include <ABI42_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI42_0_0React/core/LayoutContext.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class RootShadowNode;

extern const char RootComponentName[];

/*
 * `ShadowNode` for the root component.
 * Besides all functionality of the `View` component, `RootShadowNode` contains
 * props which represent external layout constraints and context of the
 * shadow tree.
 */
class RootShadowNode final
    : public ConcreteViewShadowNode<RootComponentName, RootProps> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  using Shared = std::shared_ptr<RootShadowNode const>;
  using Unshared = std::shared_ptr<RootShadowNode>;

  /*
   * Layouts the shadow tree if needed.
   * Returns `false` if the three is already laid out.
   */
  bool layoutIfNeeded(
      std::vector<LayoutableShadowNode const *> *affectedNodes = {});

  /*
   * Clones the node with given `layoutConstraints` and `layoutContext`.
   */
  RootShadowNode::Unshared clone(
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext) const;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
