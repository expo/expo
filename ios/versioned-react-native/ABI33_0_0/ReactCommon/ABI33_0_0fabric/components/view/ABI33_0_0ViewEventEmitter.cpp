/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0ViewEventEmitter.h"

namespace facebook {
namespace ReactABI33_0_0 {

#pragma mark - Accessibility

void ViewEventEmitter::onAccessibilityAction(const std::string &name) const {
  dispatchEvent("accessibilityAction", [name](ABI33_0_0jsi::Runtime &runtime) {
    auto payload = ABI33_0_0jsi::Object(runtime);
    payload.setProperty(runtime, "action", name);
    return payload;
  });
}

void ViewEventEmitter::onAccessibilityTap() const {
  dispatchEvent("accessibilityTap");
}

void ViewEventEmitter::onAccessibilityMagicTap() const {
  dispatchEvent("magicTap");
}

void ViewEventEmitter::onAccessibilityEscape() const {
  dispatchEvent("accessibilityEscape");
}

#pragma mark - Layout

void ViewEventEmitter::onLayout(const LayoutMetrics &layoutMetrics) const {
  dispatchEvent("layout", [frame = layoutMetrics.frame](ABI33_0_0jsi::Runtime &runtime) {
    auto layout = ABI33_0_0jsi::Object(runtime);
    layout.setProperty(runtime, "x", frame.origin.x);
    layout.setProperty(runtime, "y", frame.origin.y);
    layout.setProperty(runtime, "width", frame.size.width);
    layout.setProperty(runtime, "height", frame.size.height);
    auto payload = ABI33_0_0jsi::Object(runtime);
    payload.setProperty(runtime, "layout", std::move(layout));
    return payload;
  });
}

} // namespace ReactABI33_0_0
} // namespace facebook
