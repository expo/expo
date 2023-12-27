/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/components/text/RawTextProps.h>
#include <ABI42_0_0React/core/ConcreteShadowNode.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in ABI42_0_0React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
using RawTextShadowNode =
    ConcreteShadowNode<RawTextComponentName, ShadowNode, RawTextProps>;

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
