/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <map>
#include <string>
#include <vector>

#include <folly/dynamic.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

struct MethodCall {
  int moduleId;
  int methodId;
  folly::dynamic arguments;
  int callId;

  MethodCall(int mod, int meth, folly::dynamic &&args, int cid)
      : moduleId(mod),
        methodId(meth),
        arguments(std::move(args)),
        callId(cid) {}
};

/// \throws std::invalid_argument
std::vector<MethodCall> parseMethodCalls(folly::dynamic &&calls);

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
