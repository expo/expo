/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0jsi/ABI43_0_0jsi.h>
#include <memory.h>

namespace ABI43_0_0facebook {
namespace jsc {

std::unique_ptr<jsi::Runtime> makeJSCRuntime();

} // namespace jsc
} // namespace ABI43_0_0facebook
