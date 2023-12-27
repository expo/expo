/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI44_0_0YGEnums.h"

struct ABI44_0_0YGNode;
struct ABI44_0_0YGConfig;

namespace ABI44_0_0facebook {
namespace yoga {

namespace detail {

struct Log {
  static void log(
      ABI44_0_0YGNode* node,
      ABI44_0_0YGLogLevel level,
      void*,
      const char* message,
      ...) noexcept;

  static void log(
      ABI44_0_0YGConfig* config,
      ABI44_0_0YGLogLevel level,
      void*,
      const char* format,
      ...) noexcept;
};

} // namespace detail
} // namespace yoga
} // namespace ABI44_0_0facebook
