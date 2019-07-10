/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <ReactABI34_0_0/components/view/ViewEventEmitter.h>

namespace facebook {
namespace ReactABI34_0_0 {

class SliderEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onValueChange(float value) const;
  void onSlidingComplete(float value) const;
};

} // namespace ReactABI34_0_0
} // namespace facebook
