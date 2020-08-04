/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ComponentDescriptor.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

ComponentDescriptor::ComponentDescriptor(
    EventDispatcher::Shared const &eventDispatcher,
    ContextContainer::Shared const &contextContainer)
    : eventDispatcher_(eventDispatcher), contextContainer_(contextContainer) {}

ContextContainer::Shared const &ComponentDescriptor::getContextContainer()
    const {
  return contextContainer_;
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
