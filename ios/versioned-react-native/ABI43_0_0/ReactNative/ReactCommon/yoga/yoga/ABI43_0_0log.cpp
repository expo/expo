/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0log.h"

#include "ABI43_0_0Yoga.h"
#include "ABI43_0_0YGConfig.h"
#include "ABI43_0_0YGNode.h"

namespace ABI43_0_0facebook {
namespace yoga {
namespace detail {

namespace {

void vlog(
    ABI43_0_0YGConfig* config,
    ABI43_0_0YGNode* node,
    ABI43_0_0YGLogLevel level,
    void* context,
    const char* format,
    va_list args) {
  ABI43_0_0YGConfig* logConfig = config != nullptr ? config : ABI43_0_0YGConfigGetDefault();
  logConfig->log(logConfig, node, level, context, format, args);
}
} // namespace

YOGA_EXPORT void Log::log(
    ABI43_0_0YGNode* node,
    ABI43_0_0YGLogLevel level,
    void* context,
    const char* format,
    ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(
      node == nullptr ? nullptr : node->getConfig(),
      node,
      level,
      context,
      format,
      args);
  va_end(args);
}

void Log::log(
    ABI43_0_0YGConfig* config,
    ABI43_0_0YGLogLevel level,
    void* context,
    const char* format,
    ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(config, nullptr, level, context, format, args);
  va_end(args);
}

} // namespace detail
} // namespace yoga
} // namespace ABI43_0_0facebook
