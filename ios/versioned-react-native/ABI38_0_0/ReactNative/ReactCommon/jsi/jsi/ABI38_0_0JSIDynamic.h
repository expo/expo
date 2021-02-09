/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI38_0_0jsi/ABI38_0_0jsi.h>

namespace ABI38_0_0facebook {
namespace jsi {

ABI38_0_0facebook::jsi::Value valueFromDynamic(
    ABI38_0_0facebook::jsi::Runtime& runtime,
    const folly::dynamic& dyn);

folly::dynamic dynamicFromValue(
    ABI38_0_0facebook::jsi::Runtime& runtime,
    const ABI38_0_0facebook::jsi::Value& value);

} // namespace jsi
} // namespace ABI38_0_0facebook
