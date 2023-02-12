/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <memory.h>

namespace ABI47_0_0facebook {
namespace jsc {

std::unique_ptr<jsi::Runtime> makeJSCRuntime();

} // namespace jsc
} // namespace ABI47_0_0facebook
