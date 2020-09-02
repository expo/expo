/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI39_0_0YGEnums.h"

struct ABI39_0_0YGNode;
struct ABI39_0_0YGConfig;

namespace ABI39_0_0facebook {
namespace yoga {

namespace detail {

struct Log {
  static void log(
      ABI39_0_0YGNode* node,
      ABI39_0_0YGLogLevel level,
      void*,
      const char* message,
      ...) noexcept;

  static void log(
      ABI39_0_0YGConfig* config,
      ABI39_0_0YGLogLevel level,
      void*,
      const char* format,
      ...) noexcept;
};

} // namespace detail
} // namespace yoga
} // namespace ABI39_0_0facebook
