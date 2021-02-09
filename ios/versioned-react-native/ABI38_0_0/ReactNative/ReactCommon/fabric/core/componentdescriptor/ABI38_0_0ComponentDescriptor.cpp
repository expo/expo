/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0ComponentDescriptor.h"

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

ComponentDescriptor::ComponentDescriptor(
    EventDispatcher::Weak const &eventDispatcher,
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
    : eventDispatcher_(eventDispatcher),
      contextContainer_(contextContainer),
      flavor_(flavor) {}

ContextContainer::Shared const &ComponentDescriptor::getContextContainer()
    const {
  return contextContainer_;
}

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
