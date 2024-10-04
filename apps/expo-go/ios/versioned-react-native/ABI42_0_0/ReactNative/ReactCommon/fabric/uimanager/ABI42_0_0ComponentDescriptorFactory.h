/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI42_0_0React/core/ComponentDescriptor.h>
#include <ABI42_0_0React/core/EventDispatcher.h>
#include <ABI42_0_0React/utils/ContextContainer.h>

#include "ABI42_0_0ComponentDescriptorRegistry.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/**
 * A factory to provide hosting app specific set of ComponentDescriptor's.
 * Each app must provide an implementation of the static class method which
 * should register its specific set of supported components.
 */
using ComponentRegistryFactory =
    std::function<SharedComponentDescriptorRegistry(
        EventDispatcher::Weak const &eventDispatcher,
        ContextContainer::Shared const &contextContainer)>;

ComponentRegistryFactory getDefaultComponentRegistryFactory();

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
