/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace chrome {

bool isNetworkInspected(
    const std::string &owner,
    const std::string &app,
    const std::string &device);
}
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
