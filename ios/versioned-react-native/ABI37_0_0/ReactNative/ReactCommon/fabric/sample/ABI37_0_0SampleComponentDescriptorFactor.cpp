/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI37_0_0React/uimanager/ComponentDescriptorFactory.h>
#include <ABI37_0_0React/uimanager/ComponentDescriptorRegistry.h>
#include <ABI37_0_0React/utils/ContextContainer.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/**
 * This is a sample implementation. Each app should provide its own.
 */
ComponentRegistryFactory getDefaultComponentRegistryFactory() {
  return [](const EventDispatcher::Shared &eventDispatcher,
            const ContextContainer::Shared &contextContainer) {
    auto registry = std::make_shared<ComponentDescriptorRegistry>();
    return registry;
  };
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
