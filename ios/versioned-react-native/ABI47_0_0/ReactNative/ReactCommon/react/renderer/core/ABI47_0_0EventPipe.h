/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/EventTarget.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ABI47_0_0ReactEventPriority.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ValueFactory.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

using EventPipe = std::function<void(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    ABI47_0_0ReactEventPriority priority,
    const ValueFactory &payloadFactory)>;

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
