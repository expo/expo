/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/activityindicator/ActivityIndicatorViewProps.h>
#include <ReactABI34_0_0/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace ReactABI34_0_0 {

extern const char ActivityIndicatorViewComponentName[];

/*
 * `ShadowNode` for <ActivityIndicatorView> component.
 */
using ActivityIndicatorViewShadowNode = ConcreteViewShadowNode<
    ActivityIndicatorViewComponentName,
    ActivityIndicatorViewProps>;

} // namespace ReactABI34_0_0
} // namespace facebook
