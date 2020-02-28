/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0StateUpdate.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

std::pair<StateTarget, StateData::Shared> StateUpdate::operator()() const {
  return callback_();
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
