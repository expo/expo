/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0RuntimeAdapter.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0hermes {
namespace inspector {

RuntimeAdapter::~RuntimeAdapter() = default;

void RuntimeAdapter::tickleJs() {}

SharedRuntimeAdapter::SharedRuntimeAdapter(
    std::shared_ptr<jsi::Runtime> runtime,
    debugger::Debugger &debugger)
    : runtime_(std::move(runtime)), debugger_(debugger) {}

SharedRuntimeAdapter::~SharedRuntimeAdapter() = default;

jsi::Runtime &SharedRuntimeAdapter::getRuntime() {
  return *runtime_;
}

debugger::Debugger &SharedRuntimeAdapter::getDebugger() {
  return debugger_;
}

} // namespace inspector
} // namespace ABI47_0_0hermes
} // namespace ABI47_0_0facebook
