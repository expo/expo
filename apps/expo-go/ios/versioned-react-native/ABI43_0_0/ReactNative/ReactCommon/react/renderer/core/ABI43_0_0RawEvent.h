/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <ABI43_0_0React/ABI43_0_0renderer/core/EventTarget.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ValueFactory.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Represents ready-to-dispatch event object.
 */
class RawEvent {
 public:
  RawEvent(
      std::string type,
      ValueFactory payloadFactory,
      SharedEventTarget eventTarget);

  std::string type;
  ValueFactory payloadFactory;
  SharedEventTarget eventTarget;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
