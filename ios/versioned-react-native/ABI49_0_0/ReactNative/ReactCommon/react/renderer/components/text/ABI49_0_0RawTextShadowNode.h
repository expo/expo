/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/text/RawTextProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteShadowNode.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in ABI49_0_0React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
class RawTextShadowNode : public ConcreteShadowNode<
                              RawTextComponentName,
                              ShadowNode,
                              RawTextProps> {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteShadowNode::BaseTraits();
    traits.set(IdentifierTrait());
    return traits;
  }
  static ShadowNodeTraits::Trait IdentifierTrait() {
    return ShadowNodeTraits::Trait::RawText;
  }
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
