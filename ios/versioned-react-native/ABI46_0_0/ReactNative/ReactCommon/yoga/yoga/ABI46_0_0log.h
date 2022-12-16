/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include "ABI46_0_0YGEnums.h"

struct ABI46_0_0YGNode;
struct ABI46_0_0YGConfig;

namespace ABI46_0_0facebook {
namespace yoga {

namespace detail {

struct Log {
  static void log(
      ABI46_0_0YGNode* node,
      ABI46_0_0YGLogLevel level,
      void*,
      const char* message,
      ...) noexcept;

  static void log(
      ABI46_0_0YGConfig* config,
      ABI46_0_0YGLogLevel level,
      void*,
      const char* format,
      ...) noexcept;
};

} // namespace detail
} // namespace yoga
} // namespace ABI46_0_0facebook

#endif
