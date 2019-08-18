/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0EventBeat.h"

namespace facebook {
namespace ReactABI34_0_0 {

void EventBeat::request() const {
  isRequested_ = true;
}

void EventBeat::beat(jsi::Runtime &runtime) const {
  if (!this->isRequested_) {
    return;
  }

  isRequested_ = false;

  if (beatCallback_) {
    beatCallback_(runtime);
  }
}

void EventBeat::induce() const {
  // Default implementation does nothing.
}

void EventBeat::setBeatCallback(const BeatCallback &beatCallback) {
  beatCallback_ = beatCallback;
}

void EventBeat::setFailCallback(const FailCallback &failCallback) {
  failCallback_ = failCallback;
}

} // namespace ReactABI34_0_0
} // namespace facebook
