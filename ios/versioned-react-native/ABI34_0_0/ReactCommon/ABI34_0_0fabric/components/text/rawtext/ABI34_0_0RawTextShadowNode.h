/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/text/RawTextProps.h>
#include <ReactABI34_0_0/core/ConcreteShadowNode.h>

namespace facebook {
namespace ReactABI34_0_0 {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in ReactABI34_0_0. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
using RawTextShadowNode =
    ConcreteShadowNode<RawTextComponentName, RawTextProps>;

} // namespace ReactABI34_0_0
} // namespace facebook
