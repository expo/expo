/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/core/ComponentDescriptor.h>
#include <ABI42_0_0React/core/EventDispatcher.h>
#include <ABI42_0_0React/utils/ContextContainer.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Callable signature that represents the signature of `ComponentDescriptor`
 * constructor. The callable returns a unique pointer conveniently represents an
 * abstract type and ownership of the newly created object.
 */
using ComponentDescriptorConstructor = ComponentDescriptor::Unique(
    ComponentDescriptorParameters const &parameters);

/*
 * Represents a unified way to construct an instance of a particular stored
 * `ComponentDescriptor` class. C++ does not allow to create pointers to
 * constructors, so we have to have such data structure to manipulate a
 * collection of classes.
 *
 * Note: The actual values of `handle` and `name` for some components depend on
 * `flavor`. The provider is valid if instantiated by `constructor` object with
 * given `flavor` exposes the same values of `handle` and `name`.
 */
class ComponentDescriptorProvider final {
 public:
  ComponentHandle handle;
  ComponentName name;
  ComponentDescriptor::Flavor flavor;
  ComponentDescriptorConstructor *constructor;
};

/*
 * Creates a `ComponentDescriptor` for given `ComponentDescriptorParameters`.
 */
template <typename ComponentDescriptorT>
ComponentDescriptor::Unique concreteComponentDescriptorConstructor(
    ComponentDescriptorParameters const &parameters) {
  static_assert(
      std::is_base_of<ComponentDescriptor, ComponentDescriptorT>::value,
      "ComponentDescriptorT must be a descendant of ComponentDescriptor");

  return std::make_unique<ComponentDescriptorT const>(parameters);
}

/*
 * Creates a `ComponentDescriptorProvider` for given `ComponentDescriptor`
 * class.
 */
template <typename ComponentDescriptorT>
ComponentDescriptorProvider concreteComponentDescriptorProvider() {
  static_assert(
      std::is_base_of<ComponentDescriptor, ComponentDescriptorT>::value,
      "ComponentDescriptorT must be a descendant of ComponentDescriptor");

  return {ComponentDescriptorT::ConcreteShadowNode::Handle(),
          ComponentDescriptorT::ConcreteShadowNode::Name(),
          nullptr,
          &concreteComponentDescriptorConstructor<ComponentDescriptorT>};
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
