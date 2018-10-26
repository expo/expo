/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0core/ComponentDescriptor.h>
#include <ABI31_0_0fabric/ABI31_0_0events/EventDispatcher.h>
#include <ABI31_0_0fabric/ABI31_0_0uimanager/ContextContainer.h>

#include "ABI31_0_0ComponentDescriptorRegistry.h"

namespace facebook {
namespace ReactABI31_0_0 {

/**
 * A factory to provide hosting app specific set of ComponentDescriptor's.
 * Each app must provide an implementation of the static class method which
 * should register its specific set of supported components.
 */
class ComponentDescriptorFactory {

public:
  static SharedComponentDescriptorRegistry buildRegistry(const SharedEventDispatcher &eventDispatcher, const SharedContextContainer &contextContainer);
};

} // namespace ReactABI31_0_0
} // namespace facebook
