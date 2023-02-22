/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0Registration.h"
#include "ABI48_0_0ConnectionDemux.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0hermes {
namespace inspector {
namespace chrome {

namespace {

ConnectionDemux &demux() {
  static ConnectionDemux instance{ABI48_0_0facebook::ABI48_0_0React::getInspectorInstance()};
  return instance;
}

} // namespace

DebugSessionToken enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title) {
  return demux().enableDebugging(std::move(adapter), title);
}

void disableDebugging(DebugSessionToken session) {
  demux().disableDebugging(session);
}

} // namespace chrome
} // namespace inspector
} // namespace ABI48_0_0hermes
} // namespace ABI48_0_0facebook
