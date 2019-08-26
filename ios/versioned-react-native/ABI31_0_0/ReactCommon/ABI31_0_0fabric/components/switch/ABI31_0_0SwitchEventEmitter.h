/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/view/ViewEventEmitter.h>

namespace facebook {
namespace ReactABI31_0_0 {

class SwitchEventEmitter:
  public ViewEventEmitter {

public:

  using ViewEventEmitter::ViewEventEmitter;

  void onChange(const bool &value) const;
};

} // namespace ReactABI31_0_0
} // namespace facebook
