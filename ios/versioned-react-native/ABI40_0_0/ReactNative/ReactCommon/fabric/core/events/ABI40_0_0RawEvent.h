/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <ABI40_0_0React/core/EventTarget.h>
#include <ABI40_0_0React/core/ValueFactory.h>

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

/*
 * Represents ready-to-dispatch event object.
 */
class RawEvent {
 public:
  RawEvent(
      std::string type,
      ValueFactory payloadFactory,
      SharedEventTarget eventTarget);

  const std::string type;
  const ValueFactory payloadFactory;
  const SharedEventTarget eventTarget;
};

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
