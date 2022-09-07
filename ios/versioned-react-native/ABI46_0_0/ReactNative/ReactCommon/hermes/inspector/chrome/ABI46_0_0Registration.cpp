/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI46_0_0Registration.h"
#include "ABI46_0_0ConnectionDemux.h"

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace chrome {

namespace {

ConnectionDemux &demux() {
  static ConnectionDemux instance{ABI46_0_0facebook::ABI46_0_0React::getInspectorInstance()};
  return instance;
}

} // namespace

void enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title) {
  demux().enableDebugging(std::move(adapter), title);
}

void disableDebugging(HermesRuntime &runtime) {
  demux().disableDebugging(runtime);
}

} // namespace chrome
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
