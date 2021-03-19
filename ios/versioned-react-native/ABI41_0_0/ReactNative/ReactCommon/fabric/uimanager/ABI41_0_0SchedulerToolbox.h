/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/core/EventBeat.h>
#include <ABI41_0_0React/uimanager/ComponentDescriptorFactory.h>
#include <ABI41_0_0React/utils/ContextContainer.h>
#include <ABI41_0_0React/utils/RuntimeExecutor.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Contains all external dependencies of Scheduler.
 * Copyable.
 */
struct SchedulerToolbox final {
  /*
   * Represents general purpose DI container for product components/needs.
   * Must not be `nullptr`.
   */
  ContextContainer::Shared contextContainer;

  /*
   * Represents externally managed, lazily available collection of components.
   */
  ComponentRegistryFactory componentRegistryFactory;

  /*
   * Represents running JavaScript VM and associated execution queue.
   */
  RuntimeExecutor runtimeExecutor;

  /*
   * Asynchronous & synchronous event beats.
   * Represent connections with the platform-specific run loops and general
   * purpose background queue.
   */
  EventBeat::Factory asynchronousEventBeatFactory;
  EventBeat::Factory synchronousEventBeatFactory;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
