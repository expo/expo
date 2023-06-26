/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace ABI49_0_0facebook {
namespace jsi {

ABI49_0_0facebook::jsi::Value valueFromDynamic(
    ABI49_0_0facebook::jsi::Runtime& runtime,
    const folly::dynamic& dyn);

folly::dynamic dynamicFromValue(
    ABI49_0_0facebook::jsi::Runtime& runtime,
    const ABI49_0_0facebook::jsi::Value& value);

} // namespace jsi
} // namespace ABI49_0_0facebook
