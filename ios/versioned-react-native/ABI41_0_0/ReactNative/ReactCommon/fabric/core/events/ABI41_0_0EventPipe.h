/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

#include <ABI41_0_0jsi/ABI41_0_0jsi.h>
#include <ABI41_0_0React/core/EventTarget.h>
#include <ABI41_0_0React/core/ValueFactory.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

using EventPipe = std::function<void(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const ValueFactory &payloadFactory)>;

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
