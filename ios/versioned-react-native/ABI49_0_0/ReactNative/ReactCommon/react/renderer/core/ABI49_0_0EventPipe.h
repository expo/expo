/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventTarget.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactEventPriority.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ValueFactory.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

using EventPipe = std::function<void(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    ABI49_0_0ReactEventPriority priority,
    const ValueFactory &payloadFactory)>;

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
