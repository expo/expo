/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI29_0_0Sealable.h"

#include <stdexcept>

namespace facebook {
namespace ReactABI29_0_0 {

void Sealable::seal() const {
  sealed_ = true;
}

bool Sealable::getSealed() const {
  return sealed_;
}

void Sealable::ensureUnsealed() const {
  if (sealed_) {
    throw std::runtime_error("Attempt to mutate a sealed object.");
  }
}

} // namespace ReactABI29_0_0
} // namespace facebook
