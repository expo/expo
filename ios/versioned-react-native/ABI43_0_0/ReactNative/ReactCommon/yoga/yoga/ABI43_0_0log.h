/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI43_0_0YGEnums.h"

struct ABI43_0_0YGNode;
struct ABI43_0_0YGConfig;

namespace ABI43_0_0facebook {
namespace yoga {

namespace detail {

struct Log {
  static void log(
      ABI43_0_0YGNode* node,
      ABI43_0_0YGLogLevel level,
      void*,
      const char* message,
      ...) noexcept;

  static void log(
      ABI43_0_0YGConfig* config,
      ABI43_0_0YGLogLevel level,
      void*,
      const char* format,
      ...) noexcept;
};

} // namespace detail
} // namespace yoga
} // namespace ABI43_0_0facebook
