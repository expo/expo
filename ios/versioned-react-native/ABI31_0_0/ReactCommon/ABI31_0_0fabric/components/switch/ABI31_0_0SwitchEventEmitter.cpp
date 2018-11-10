/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0SwitchEventEmitter.h"

namespace facebook {
namespace ReactABI31_0_0 {

void SwitchEventEmitter::onChange(const bool &value) const {
  dispatchEvent("change", folly::dynamic::object("value", value));
}

} // namespace ReactABI31_0_0
} // namespace facebook
