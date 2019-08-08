/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0MainQueueExecutor.h"

#include <dispatch/dispatch.h>
#include <folly/Indestructible.h>

namespace facebook {
namespace ReactABI34_0_0 {

MainQueueExecutor &MainQueueExecutor::instance()
{
  static auto instance = folly::Indestructible<MainQueueExecutor>{};
  return *instance;
}

void MainQueueExecutor::add(folly::Func function)
{
  __block folly::Func blockFunction = std::move(function);
  dispatch_async(dispatch_get_main_queue(), ^{
    blockFunction();
  });
}

} // namespace ReactABI34_0_0
} // namespace facebook
