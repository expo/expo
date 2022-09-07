/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <hermes/ABI46_0_0hermes.h>
#include <hermes/inspector/ABI46_0_0RuntimeAdapter.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace chrome {

/*
 * enableDebugging adds this runtime to the list of debuggable JS targets
 * (called "pages" in the higher-leavel ABI46_0_0React Native API) in this process. It
 * should be called before any JS runs in the runtime.
 */
extern void enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title);

/*
 * disableDebugging removes this runtime from the list of debuggable JS targets
 * in this process.
 */
extern void disableDebugging(HermesRuntime &runtime);

} // namespace chrome
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
