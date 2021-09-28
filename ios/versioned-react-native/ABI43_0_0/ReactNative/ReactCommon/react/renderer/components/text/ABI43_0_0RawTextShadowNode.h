/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/text/RawTextProps.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ConcreteShadowNode.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in ABI43_0_0React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
using RawTextShadowNode =
    ConcreteShadowNode<RawTextComponentName, ShadowNode, RawTextProps>;

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
