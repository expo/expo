/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0ComponentDescriptor.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

ComponentDescriptor::ComponentDescriptor(
    ComponentDescriptorParameters const &parameters)
    : eventDispatcher_(parameters.eventDispatcher),
      contextContainer_(parameters.contextContainer),
      flavor_(parameters.flavor) {}

ContextContainer::Shared const &ComponentDescriptor::getContextContainer()
    const {
  return contextContainer_;
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
