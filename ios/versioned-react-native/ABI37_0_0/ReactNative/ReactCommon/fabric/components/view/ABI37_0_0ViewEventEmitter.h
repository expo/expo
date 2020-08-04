/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <ABI37_0_0React/core/LayoutMetrics.h>
#include <ABI37_0_0React/core/ABI37_0_0ReactPrimitives.h>

#include "ABI37_0_0TouchEventEmitter.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class ViewEventEmitter;

using SharedViewEventEmitter = std::shared_ptr<const ViewEventEmitter>;

class ViewEventEmitter : public TouchEventEmitter {
 public:
  using TouchEventEmitter::TouchEventEmitter;

#pragma mark - Accessibility

  void onAccessibilityAction(const std::string &name) const;
  void onAccessibilityTap() const;
  void onAccessibilityMagicTap() const;
  void onAccessibilityEscape() const;

#pragma mark - Layout

  void onLayout(const LayoutMetrics &layoutMetrics) const;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
