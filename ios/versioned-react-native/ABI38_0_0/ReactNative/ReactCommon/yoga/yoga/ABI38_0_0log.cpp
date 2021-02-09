/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0log.h"

#include "ABI38_0_0Yoga.h"
#include "ABI38_0_0YGConfig.h"
#include "ABI38_0_0YGNode.h"

namespace ABI38_0_0facebook {
namespace yoga {
namespace detail {

namespace {

void vlog(
    ABI38_0_0YGConfig* config,
    ABI38_0_0YGNode* node,
    ABI38_0_0YGLogLevel level,
    void* context,
    const char* format,
    va_list args) {
  ABI38_0_0YGConfig* logConfig = config != nullptr ? config : ABI38_0_0YGConfigGetDefault();
  logConfig->log(logConfig, node, level, context, format, args);

  if (level == ABI38_0_0YGLogLevelFatal) {
    abort();
  }
}
} // namespace

YOGA_EXPORT void Log::log(
    ABI38_0_0YGNode* node,
    ABI38_0_0YGLogLevel level,
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
    ABI38_0_0YGConfig* config,
    ABI38_0_0YGLogLevel level,
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
} // namespace ABI38_0_0facebook
