/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/text/RawTextProps.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ConcreteShadowNode.h>

namespace facebook {
namespace ReactABI31_0_0 {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in ReactABI31_0_0. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
using RawTextShadowNode =
  ConcreteShadowNode<
    RawTextComponentName,
    RawTextProps
  >;

} // namespace ReactABI31_0_0
} // namespace facebook
