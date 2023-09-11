/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ViewEventEmitter.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

// This emitter exists only as a placeholder and is not used for communication
// with JS.
//
// See:
// - EventEmitterWrapper::invokeEvent for the Android event emitter dispatch
// - ABI47_0_0ReactTextInputManager.java for the text input events used on Android
class AndroidTextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
