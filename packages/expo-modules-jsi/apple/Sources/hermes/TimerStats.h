/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <memory>

namespace facebook {
namespace hermes {

/// Creates and returns a Runtime that computes the time spent in invocations to
/// the Hermes VM.
std::unique_ptr<jsi::Runtime> makeTimedRuntime(
    std::unique_ptr<jsi::Runtime> hermesRuntime);

} // namespace hermes
} // namespace facebook
