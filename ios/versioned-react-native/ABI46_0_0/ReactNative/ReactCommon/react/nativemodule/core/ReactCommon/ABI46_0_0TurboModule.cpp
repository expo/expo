/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI46_0_0TurboModule.h"

using namespace ABI46_0_0facebook;

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

TurboModule::TurboModule(
    const std::string &name,
    std::shared_ptr<CallInvoker> jsInvoker)
    : name_(name), jsInvoker_(jsInvoker) {}

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
