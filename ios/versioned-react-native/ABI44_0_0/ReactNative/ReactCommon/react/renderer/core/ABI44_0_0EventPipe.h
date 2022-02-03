/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

#include <ABI44_0_0jsi/ABI44_0_0jsi.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/EventTarget.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/ValueFactory.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

using EventPipe = std::function<void(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const ValueFactory &payloadFactory)>;

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
