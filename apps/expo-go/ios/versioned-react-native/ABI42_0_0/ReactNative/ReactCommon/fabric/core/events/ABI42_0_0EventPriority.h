/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

enum class EventPriority : int {
  SynchronousUnbatched,
  SynchronousBatched,
  AsynchronousUnbatched,
  AsynchronousBatched,

  Sync = SynchronousUnbatched,
  Work = SynchronousBatched,
  Interactive = AsynchronousUnbatched,
  Deferred = AsynchronousBatched
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
