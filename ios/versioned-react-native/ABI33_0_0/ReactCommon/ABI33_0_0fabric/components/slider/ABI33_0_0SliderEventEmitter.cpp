/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0SliderEventEmitter.h"

namespace facebook {
namespace ReactABI33_0_0 {

void SliderEventEmitter::onValueChange(float value) const {
  dispatchEvent("valueChange", [value](ABI33_0_0jsi::Runtime &runtime) {
    auto payload = ABI33_0_0jsi::Object(runtime);
    payload.setProperty(runtime, "value", value);
    return payload;
  });
}

void SliderEventEmitter::onSlidingComplete(float value) const {
  dispatchEvent("slidingComplete", [value](ABI33_0_0jsi::Runtime &runtime) {
    auto payload = ABI33_0_0jsi::Object(runtime);
    payload.setProperty(runtime, "value", value);
    return payload;
  });
}

} // namespace ReactABI33_0_0
} // namespace facebook
