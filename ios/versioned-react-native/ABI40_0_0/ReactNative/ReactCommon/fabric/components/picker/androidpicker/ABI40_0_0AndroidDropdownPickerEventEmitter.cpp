/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI40_0_0AndroidDropdownPickerEventEmitter.h"

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

void AndroidDropdownPickerEventEmitter::onSelect(
    AndroidDropdownPickerOnSelectStruct event) const {
  dispatchEvent("select", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "position", event.position);
    return payload;
  });
}

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
