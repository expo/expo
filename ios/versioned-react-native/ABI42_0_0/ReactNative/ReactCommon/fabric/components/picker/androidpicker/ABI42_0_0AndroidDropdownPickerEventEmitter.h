/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/components/view/ViewEventEmitter.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

struct AndroidDropdownPickerOnSelectStruct {
  int position;
};

class AndroidDropdownPickerEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onSelect(AndroidDropdownPickerOnSelectStruct value) const;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
