/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNode.h>
#include "ABI43_0_0StubView.h"
#include "ABI43_0_0StubViewTree.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

StubViewTree stubViewTreeFromShadowNode(ShadowNode const &rootShadowNode);

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
