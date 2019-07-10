/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactABI34_0_0/uimanager/ComponentDescriptorFactory.h>
#include <ReactABI34_0_0/uimanager/ComponentDescriptorRegistry.h>
#include <ReactABI34_0_0/uimanager/ContextContainer.h>

namespace facebook {
namespace ReactABI34_0_0 {

/**
 * This is a sample implementation. Each app should provide its own.
 */
ComponentRegistryFactory getDefaultComponentRegistryFactory() {
  return [](const SharedEventDispatcher &eventDispatcher,
            const SharedContextContainer &contextContainer) {
    auto registry = std::make_shared<ComponentDescriptorRegistry>();
    return registry;
  }
}

} // namespace ReactABI34_0_0
} // namespace facebook
