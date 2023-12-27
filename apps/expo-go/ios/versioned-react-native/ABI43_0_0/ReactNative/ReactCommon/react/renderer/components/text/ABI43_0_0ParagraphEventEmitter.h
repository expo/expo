/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewEventEmitter.h>
#include <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/TextMeasureCache.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class ParagraphEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onTextLayout(LinesMeasurements const &linesMeasurements) const;

 private:
  mutable std::mutex linesMeasurementsMutex_;
  mutable LinesMeasurements linesMeasurementsMetrics_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
