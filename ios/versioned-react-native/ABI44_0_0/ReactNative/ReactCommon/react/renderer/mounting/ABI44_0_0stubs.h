/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI44_0_0React/ABI44_0_0renderer/core/ShadowNode.h>
#include "ABI44_0_0StubView.h"
#include "ABI44_0_0StubViewTree.h"

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

StubViewTree stubViewTreeFromShadowNode(ShadowNode const &rootShadowNode);

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
