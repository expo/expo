/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <memory>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class LayoutAnimationCallbackWrapper {
 public:
  LayoutAnimationCallbackWrapper(jsi::Function &&callback)
      : callback_(std::make_shared<jsi::Function>(std::move(callback))) {}
  LayoutAnimationCallbackWrapper() : callback_(nullptr) {}

  void call(jsi::Runtime &runtime) const {
    if (callback_) {
      callback_->call(runtime);
      callback_.reset();
    }
  }

 private:
  mutable std::shared_ptr<jsi::Function> callback_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
