/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI33_0_0jsi/ABI33_0_0jsi.h>

#include <ReactABI33_0_0/events/EventTarget.h>

namespace facebook {
namespace ReactABI33_0_0 {

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

/*
 * We need this types only to ensure type-safety when we deal with them.
 * Conceptually, they are opaque pointers to some types that derived from those
 * classes.
 *
 * `EventHandler` is managed as a `unique_ptr`, so it must have a *virtual*
 * destructor to allow proper deallocation having only a pointer
 * to the base (`EventHandler`) class.
 */
struct EventHandler {
  virtual ~EventHandler() = default;
};
using UniqueEventHandler = std::unique_ptr<const EventHandler>;

using ValueFactory = std::function<ABI33_0_0jsi::Value(ABI33_0_0jsi::Runtime &runtime)>;

using EventPipe = std::function<void(
    ABI33_0_0jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const ValueFactory &payloadFactory)>;

} // namespace ReactABI33_0_0
} // namespace facebook
