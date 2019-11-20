/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <ReactABI34_0_0/core/LayoutMetrics.h>
#include <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>
#include "ABI34_0_0TouchEventEmitter.h"

namespace facebook {
namespace ReactABI34_0_0 {

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

} // namespace ReactABI34_0_0
} // namespace facebook
