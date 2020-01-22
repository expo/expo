/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI36_0_0log.h"

#include "ABI36_0_0Yoga.h"
#include "ABI36_0_0YGConfig.h"
#include "ABI36_0_0YGNode.h"

namespace ABI36_0_0facebook {
namespace yoga {
namespace detail {

namespace {

void vlog(
    ABI36_0_0YGConfig* config,
    ABI36_0_0YGNode* node,
    ABI36_0_0YGLogLevel level,
    void* context,
    const char* format,
    va_list args) {
  ABI36_0_0YGConfig* logConfig = config != nullptr ? config : ABI36_0_0YGConfigGetDefault();
  logConfig->log(logConfig, node, level, context, format, args);

  if (level == ABI36_0_0YGLogLevelFatal) {
    abort();
  }
}
} // namespace

void Log::log(
    ABI36_0_0YGNode* node,
    ABI36_0_0YGLogLevel level,
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
    ABI36_0_0YGConfig* config,
    ABI36_0_0YGLogLevel level,
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
} // namespace ABI36_0_0facebook
