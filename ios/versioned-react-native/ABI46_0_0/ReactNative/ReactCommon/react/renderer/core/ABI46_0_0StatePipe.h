/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <ABI46_0_0React/ABI46_0_0renderer/core/StateUpdate.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

using StatePipe = std::function<void(StateUpdate const &stateUpdate)>;

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
