/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0EventTarget.h"

namespace facebook {
namespace ReactABI33_0_0 {

using Tag = EventTarget::Tag;

EventTarget::EventTarget(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::Value &instanceHandle,
    Tag tag)
    : weakInstanceHandle_(
          ABI33_0_0jsi::WeakObject(runtime, instanceHandle.asObject(runtime))),
      strongInstanceHandle_(ABI33_0_0jsi::Value::null()),
      tag_(tag) {}

void EventTarget::setEnabled(bool enabled) const {
  enabled_ = enabled;
}

void EventTarget::retain(ABI33_0_0jsi::Runtime &runtime) const {
  if (!enabled_) {
    return;
  }

  strongInstanceHandle_ = weakInstanceHandle_.lock(runtime);

  // Having a `null` or `undefined` object here indicates that
  // `weakInstanceHandle_` was already deallocated. This should *not* happen by
  // design, and if it happens it's a severe problem. This basically means that
  // particular implementation of ABI33_0_0JSI was able to detect this inconsistency and
  // dealt with it, but some ABI33_0_0JSI implementation may not support this feature and
  // that case will lead to a crash in those environments.
  assert(!strongInstanceHandle_.isNull());
  assert(!strongInstanceHandle_.isUndefined());
}

void EventTarget::release(ABI33_0_0jsi::Runtime &runtime) const {
  // The method does not use `ABI33_0_0jsi::Runtime` reference.
  // It takes it only to ensure thread-safety (if the caller has the reference,
  // we are on a proper thread).
  strongInstanceHandle_ = ABI33_0_0jsi::Value::null();
}

ABI33_0_0jsi::Value EventTarget::getInstanceHandle(ABI33_0_0jsi::Runtime &runtime) const {
  if (strongInstanceHandle_.isNull()) {
    // The `instanceHandle` is not retained.
    return ABI33_0_0jsi::Value::null();
  }

  return ABI33_0_0jsi::Value(runtime, strongInstanceHandle_);
}

Tag EventTarget::getTag() const {
  return tag_;
}

} // namespace ReactABI33_0_0
} // namespace facebook
