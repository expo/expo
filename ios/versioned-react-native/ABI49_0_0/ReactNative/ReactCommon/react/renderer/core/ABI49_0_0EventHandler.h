/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
