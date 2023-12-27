/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0jsireact/ABI43_0_0JSIExecutor.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/**
 * Creates a lambda used to bind a JSIRuntime in the context of
 * Apple platforms, such as console logging, performance metrics, etc.
 */
JSIExecutor::RuntimeInstaller ABI43_0_0RCTJSIExecutorRuntimeInstaller(
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
