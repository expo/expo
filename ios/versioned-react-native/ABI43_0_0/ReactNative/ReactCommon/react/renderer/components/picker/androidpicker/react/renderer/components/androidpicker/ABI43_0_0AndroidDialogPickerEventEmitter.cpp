/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0AndroidDialogPickerEventEmitter.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

void AndroidDialogPickerEventEmitter::onSelect(
    AndroidDialogPickerOnSelectStruct event) const {
  dispatchEvent("select", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "position", event.position);
    return payload;
  });
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
