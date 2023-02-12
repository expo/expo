/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <ABI48_0_0React/ABI48_0_0renderer/core/StateUpdate.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

using StatePipe = std::function<void(StateUpdate const &stateUpdate)>;

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
