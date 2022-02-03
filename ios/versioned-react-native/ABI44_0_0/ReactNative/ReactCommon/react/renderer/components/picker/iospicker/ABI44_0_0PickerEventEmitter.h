/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI44_0_0React/ABI44_0_0renderer/components/view/ViewEventEmitter.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class PickerEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  struct PickerIOSChangeEvent {
    std::string newValue;
    int newIndex;
  };

  void onChange(PickerIOSChangeEvent event) const;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
