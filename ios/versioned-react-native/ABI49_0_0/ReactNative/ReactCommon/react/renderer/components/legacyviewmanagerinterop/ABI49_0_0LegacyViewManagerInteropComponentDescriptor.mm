/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0LegacyViewManagerInteropComponentDescriptor.h"
#include <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#include <ABI49_0_0React/ABI49_0_0RCTBridgeModuleDecorator.h>
#include <ABI49_0_0React/ABI49_0_0RCTComponentData.h>
#include <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#include <ABI49_0_0React/ABI49_0_0RCTModuleData.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>
#include <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>
#include "ABI49_0_0LegacyViewManagerInteropState.h"
#include "ABI49_0_0RCTLegacyViewManagerInteropCoordinator.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

static std::string moduleNameFromComponentName(const std::string &componentName)
{
  // TODO: remove FB specific code (T56174424)
  if (componentName == "StickerInputView") {
    return "FBStickerInputViewManager";
  }

  if (componentName == "FDSTooltipView") {
    return "FBABI49_0_0ReactFDSTooltipViewManager";
  }

  std::string fbPrefix("FB");
  if (std::mismatch(fbPrefix.begin(), fbPrefix.end(), componentName.begin()).first == fbPrefix.end()) {
    // If `moduleName` has "FB" prefix.
    return componentName + "Manager";
  }

  std::string artPrefix("ABI49_0_0ART");
  if (std::mismatch(artPrefix.begin(), artPrefix.end(), componentName.begin()).first == artPrefix.end()) {
    return componentName + "Manager";
  }

  std::string rnPrefix("ABI49_0_0RN");
  if (std::mismatch(rnPrefix.begin(), rnPrefix.end(), componentName.begin()).first == rnPrefix.end()) {
    return componentName + "Manager";
  }

  return "ABI49_0_0RCT" + componentName + "Manager";
}

inline NSString *ABI49_0_0RCTNSStringFromString(const std::string &string)
{
  return [NSString stringWithCString:string.c_str() encoding:NSUTF8StringEncoding];
}

static std::shared_ptr<void> const constructCoordinator(
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
{
  auto componentName = *std::static_pointer_cast<std::string const>(flavor);
  auto moduleName = moduleNameFromComponentName(componentName);
  Class module = NSClassFromString(ABI49_0_0RCTNSStringFromString(moduleName));
  assert(module);
  auto optionalBridge = contextContainer->find<std::shared_ptr<void>>("Bridge");
  ABI49_0_0RCTBridge *bridge;
  if (optionalBridge) {
    bridge = unwrapManagedObjectWeakly(optionalBridge.value());
  }

  auto optionalEventDispatcher = contextContainer->find<std::shared_ptr<void>>("ABI49_0_0RCTEventDispatcher");
  ABI49_0_0RCTEventDispatcher *eventDispatcher;
  if (optionalEventDispatcher) {
    eventDispatcher = unwrapManagedObject(optionalEventDispatcher.value());
  }

  auto optionalModuleDecorator = contextContainer->find<std::shared_ptr<void>>("ABI49_0_0RCTBridgeModuleDecorator");
  ABI49_0_0RCTBridgeModuleDecorator *bridgeModuleDecorator;
  if (optionalModuleDecorator) {
    bridgeModuleDecorator = unwrapManagedObject(optionalModuleDecorator.value());
  }

  ABI49_0_0RCTComponentData *componentData = [[ABI49_0_0RCTComponentData alloc] initWithManagerClass:module
                                                                            bridge:bridge
                                                                   eventDispatcher:eventDispatcher];
  return wrapManagedObject([[ABI49_0_0RCTLegacyViewManagerInteropCoordinator alloc]
      initWithComponentData:componentData
                     bridge:bridge
      bridgelessInteropData:bridgeModuleDecorator]);
}

LegacyViewManagerInteropComponentDescriptor::LegacyViewManagerInteropComponentDescriptor(
    ComponentDescriptorParameters const &parameters)
    : ConcreteComponentDescriptor(parameters), _coordinator(constructCoordinator(contextContainer_, flavor_))
{
}

ComponentHandle LegacyViewManagerInteropComponentDescriptor::getComponentHandle() const
{
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName LegacyViewManagerInteropComponentDescriptor::getComponentName() const
{
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

void LegacyViewManagerInteropComponentDescriptor::adopt(ShadowNode::Unshared const &shadowNode) const
{
  ConcreteComponentDescriptor::adopt(shadowNode);

  assert(std::dynamic_pointer_cast<LegacyViewManagerInteropShadowNode>(shadowNode));
  auto legacyViewManagerInteropShadowNode = std::static_pointer_cast<LegacyViewManagerInteropShadowNode>(shadowNode);

  auto state = LegacyViewManagerInteropState{};
  state.coordinator = _coordinator;

  legacyViewManagerInteropShadowNode->setStateData(std::move(state));
}
} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
