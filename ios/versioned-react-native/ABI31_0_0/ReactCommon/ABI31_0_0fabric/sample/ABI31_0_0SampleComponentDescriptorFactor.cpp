/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI31_0_0fabric/ABI31_0_0uimanager/ComponentDescriptorFactory.h>
#include <ABI31_0_0fabric/ABI31_0_0uimanager/ComponentDescriptorRegistry.h>
#include <ABI31_0_0fabric/ABI31_0_0uimanager/ContextContainer.h>

namespace facebook {
namespace ReactABI31_0_0 {

/**
 * This is a sample implementation. Each app should provide its own.
 */
SharedComponentDescriptorRegistry ComponentDescriptorFactory::buildRegistry(
  const SharedEventDispatcher &eventDispatcher,
  const SharedContextContainer &contextContainer
) {
  auto registry = std::make_shared<ComponentDescriptorRegistry>();
  return registry;
}

} // namespace ReactABI31_0_0
} // namespace facebook
