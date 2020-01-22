/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactABI34_0_0/core/ComponentDescriptor.h>
#include <ReactABI34_0_0/events/EventDispatcher.h>
#include <ReactABI34_0_0/uimanager/ContextContainer.h>

#include "ABI34_0_0ComponentDescriptorRegistry.h"

namespace facebook {
namespace ReactABI34_0_0 {

/**
 * A factory to provide hosting app specific set of ComponentDescriptor's.
 * Each app must provide an implementation of the static class method which
 * should register its specific set of supported components.
 */
using ComponentRegistryFactory =
    std::function<SharedComponentDescriptorRegistry(
        const SharedEventDispatcher &eventDispatcher,
        const SharedContextContainer &contextContainer)>;

ComponentRegistryFactory getDefaultComponentRegistryFactory();

} // namespace ReactABI34_0_0
} // namespace facebook
