/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <butter/map.h>
#include <butter/mutex.h>

#include <ABI47_0_0React/ABI47_0_0renderer/componentregistry/ComponentDescriptorProvider.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class ComponentDescriptorProviderRegistry;
class ComponentDescriptorRegistry;

using SharedComponentDescriptorRegistry =
    std::shared_ptr<const ComponentDescriptorRegistry>;

/*
 * Registry of particular `ComponentDescriptor`s.
 */
class ComponentDescriptorRegistry {
 public:
  using Shared = std::shared_ptr<const ComponentDescriptorRegistry>;

  /*
   * Creates an object with stored `ComponentDescriptorParameters`  which will
   * be used later to create `ComponentDescriptor`s.
   */
  ComponentDescriptorRegistry(
      ComponentDescriptorParameters parameters,
      ComponentDescriptorProviderRegistry const &providerRegistry,
      ContextContainer::Shared contextContainer);

  /*
   * This is broken. Please do not use.
   * If you requesting a ComponentDescriptor and unsure that it's there, you are
   * doing something wrong.
   */
  ComponentDescriptor const *
  findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
      ComponentHandle componentHandle) const;

  ComponentDescriptor const &at(std::string const &componentName) const;
  ComponentDescriptor const &at(ComponentHandle componentHandle) const;

  bool hasComponentDescriptorAt(ComponentHandle componentHandle) const;

  ShadowNode::Shared createNode(
      Tag tag,
      std::string const &viewName,
      SurfaceId surfaceId,
      folly::dynamic const &props,
      SharedEventTarget const &eventTarget) const;

  void setFallbackComponentDescriptor(SharedComponentDescriptor descriptor);
  ComponentDescriptor::Shared getFallbackComponentDescriptor() const;

 private:
  friend class ComponentDescriptorProviderRegistry;

  void registerComponentDescriptor(
      SharedComponentDescriptor componentDescriptor) const;

  /*
   * Creates a `ComponentDescriptor` using specified
   * `ComponentDescriptorProvider` and stored `ComponentDescriptorParameters`,
   * and then adds that to the registry.
   * To be used by `ComponentDescriptorProviderRegistry` only.
   * Thread safe.
   */
  void add(ComponentDescriptorProvider componentDescriptorProvider) const;

  mutable butter::shared_mutex mutex_;
  mutable butter::map<ComponentHandle, SharedComponentDescriptor>
      _registryByHandle;
  mutable butter::map<std::string, SharedComponentDescriptor> _registryByName;
  ComponentDescriptor::Shared _fallbackComponentDescriptor;
  ComponentDescriptorParameters parameters_{};
  ComponentDescriptorProviderRegistry const &providerRegistry_;
  ContextContainer::Shared contextContainer_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
