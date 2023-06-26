/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewEventEmitter.h>
#include <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0TextMeasureCache.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ParagraphEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onTextLayout(LinesMeasurements const &linesMeasurements) const;

 private:
  mutable std::mutex linesMeasurementsMutex_;
  mutable LinesMeasurements linesMeasurementsMetrics_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
