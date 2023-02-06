/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0RawEvent.h"

namespace ABI48_0_0facebook::ABI48_0_0React {

RawEvent::RawEvent(
    std::string type,
    ValueFactory payloadFactory,
    SharedEventTarget eventTarget,
    Category category)
    : type(std::move(type)),
      payloadFactory(std::move(payloadFactory)),
      eventTarget(std::move(eventTarget)),
      category(category) {}

} // namespace ABI48_0_0facebook::ABI48_0_0React
