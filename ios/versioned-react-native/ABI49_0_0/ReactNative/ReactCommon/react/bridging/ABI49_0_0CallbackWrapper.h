/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include "ABI49_0_0LongLivedObject.h"

#include <memory>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

// Helper for passing jsi::Function arg to other methods.
class CallbackWrapper : public LongLivedObject {
 private:
  CallbackWrapper(
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : callback_(std::move(callback)),
        runtime_(runtime),
        jsInvoker_(std::move(jsInvoker)) {}

  jsi::Function callback_;
  jsi::Runtime &runtime_;
  std::shared_ptr<CallInvoker> jsInvoker_;

 public:
  static std::weak_ptr<CallbackWrapper> createWeak(
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(new CallbackWrapper(
        std::move(callback), runtime, std::move(jsInvoker)));
    LongLivedObjectCollection::get().add(wrapper);
    return wrapper;
  }

  // Delete the enclosed jsi::Function
  void destroy() {
    allowRelease();
  }

  jsi::Function &callback() {
    return callback_;
  }

  jsi::Runtime &runtime() {
    return runtime_;
  }

  CallInvoker &jsInvoker() {
    return *(jsInvoker_);
  }

  std::shared_ptr<CallInvoker> jsInvokerPtr() {
    return jsInvoker_;
  }
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
