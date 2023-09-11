/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ViewEventEmitter.h>
#include <ABI47_0_0React/ABI47_0_0renderer/textlayoutmanager/TextMeasureCache.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class ParagraphEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onTextLayout(LinesMeasurements const &linesMeasurements) const;

 private:
  mutable std::mutex linesMeasurementsMutex_;
  mutable LinesMeasurements linesMeasurementsMetrics_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
