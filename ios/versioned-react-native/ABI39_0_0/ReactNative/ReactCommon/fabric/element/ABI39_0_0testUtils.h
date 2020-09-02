/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI39_0_0React/components/root/RootComponentDescriptor.h>
#include <ABI39_0_0React/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ABI39_0_0React/components/text/ParagraphComponentDescriptor.h>
#include <ABI39_0_0React/components/text/RawTextComponentDescriptor.h>
#include <ABI39_0_0React/components/text/TextComponentDescriptor.h>
#include <ABI39_0_0React/components/view/ViewComponentDescriptor.h>
#include <ABI39_0_0React/element/ComponentBuilder.h>
#include <ABI39_0_0React/uimanager/ComponentDescriptorProviderRegistry.h>

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

inline ComponentBuilder simpleComponentBuilder() {
  ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
  auto eventDispatcher = EventDispatcher::Shared{};
  auto componentDescriptorRegistry =
      componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<RootComponentDescriptor>());
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>());
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ParagraphComponentDescriptor>());
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<TextComponentDescriptor>());
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<RawTextComponentDescriptor>());

  return ComponentBuilder{componentDescriptorRegistry};
}

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
