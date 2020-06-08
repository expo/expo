/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI38_0_0YGEnums.h"

struct ABI38_0_0YGNode;
struct ABI38_0_0YGConfig;

namespace ABI38_0_0facebook {
namespace yoga {

namespace detail {

struct Log {
  static void log(
      ABI38_0_0YGNode* node,
      ABI38_0_0YGLogLevel level,
      void*,
      const char* message,
      ...) noexcept;

  static void log(
      ABI38_0_0YGConfig* config,
      ABI38_0_0YGLogLevel level,
      void*,
      const char* format,
      ...) noexcept;
};

} // namespace detail
} // namespace yoga
} // namespace ABI38_0_0facebook
