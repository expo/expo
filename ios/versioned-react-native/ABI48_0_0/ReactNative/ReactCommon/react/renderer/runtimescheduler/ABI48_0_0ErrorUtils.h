/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

inline static void handleFatalError(
    jsi::Runtime &runtime,
    const jsi::JSError &error) {
  auto reportFatalError = "reportFatalError";
  auto errorUtils = runtime.global().getProperty(runtime, "ErrorUtils");
  if (errorUtils.isUndefined() || !errorUtils.isObject() ||
      !errorUtils.getObject(runtime).hasProperty(runtime, reportFatalError)) {
    // ErrorUtils was not set up. This probably means the bundle didn't
    // load properly.
    throw jsi::JSError(
        runtime,
        "ErrorUtils is not set up properly. Something probably went wrong trying to load the JS bundle. Trying to report error " +
            error.getMessage(),
        error.getStack());
  }

  auto func = errorUtils.asObject(runtime).getPropertyAsFunction(
      runtime, reportFatalError);

  func.call(runtime, error.value());
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
