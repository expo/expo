/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewEventEmitter.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

struct AndroidDropdownPickerOnSelectStruct {
  int position;
};

class AndroidDropdownPickerEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onSelect(AndroidDropdownPickerOnSelectStruct value) const;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
