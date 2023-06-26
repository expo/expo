/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProviderRegistry.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/modal/ModalHostViewComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/RawTextComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/TextComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0ComponentBuilder.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ModalHostViewComponentDescriptor>());

  return ComponentBuilder{componentDescriptorRegistry};
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
