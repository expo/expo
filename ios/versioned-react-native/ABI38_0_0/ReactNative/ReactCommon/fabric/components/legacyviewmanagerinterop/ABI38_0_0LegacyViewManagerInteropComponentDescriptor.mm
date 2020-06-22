/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0LegacyViewManagerInteropComponentDescriptor.h"
#include <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#include <ABI38_0_0React/ABI38_0_0RCTComponentData.h>
#include <ABI38_0_0React/ABI38_0_0RCTModuleData.h>
#include <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#include <ABI38_0_0React/utils/ContextContainer.h>
#include <ABI38_0_0React/utils/ManagedObjectWrapper.h>
#include "ABI38_0_0LegacyViewManagerInteropState.h"
#include "ABI38_0_0RCTLegacyViewManagerInteropCoordinator.h"

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

static std::string moduleNameFromComponentName(const std::string &componentName)
{
  // TODO: remove FB specific code (T56174424)
  if (componentName == "StickerInputView") {
    return "FBStickerInputViewManager";
  }
  std::string fbPrefix("FB");
  if (std::mismatch(fbPrefix.begin(), fbPrefix.end(), componentName.begin()).first == fbPrefix.end()) {
    // If `moduleName` has "FB" prefix.
    return componentName + "Manager";
  }
  return "ABI38_0_0RCT" + componentName + "Manager";
}

inline NSString *ABI38_0_0RCTNSStringFromString(const std::string &string)
{
  return [NSString stringWithCString:string.c_str() encoding:NSUTF8StringEncoding];
}

static std::shared_ptr<void> const contructCoordinator(
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
{
  auto componentName = *std::static_pointer_cast<std::string const>(flavor);
  auto moduleName = moduleNameFromComponentName(componentName);
  Class module = NSClassFromString(ABI38_0_0RCTNSStringFromString(moduleName));
  assert(module);
  ABI38_0_0RCTBridge *bridge = (ABI38_0_0RCTBridge *)unwrapManagedObjectWeakly(contextContainer->at<std::shared_ptr<void>>("Bridge"));
  ABI38_0_0RCTComponentData *componentData = [[ABI38_0_0RCTComponentData alloc] initWithManagerClass:module bridge:bridge];
  return wrapManagedObject([[ABI38_0_0RCTLegacyViewManagerInteropCoordinator alloc] initWithComponentData:componentData
                                                                                          bridge:bridge]);
}

LegacyViewManagerInteropComponentDescriptor::LegacyViewManagerInteropComponentDescriptor(
    EventDispatcher::Weak const &eventDispatcher,
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
    : ConcreteComponentDescriptor(eventDispatcher, contextContainer, flavor),
      _coordinator(contructCoordinator(contextContainer, flavor))
{
}

ComponentHandle
LegacyViewManagerInteropComponentDescriptor::getComponentHandle() const {
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName LegacyViewManagerInteropComponentDescriptor::getComponentName()
    const {
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

void LegacyViewManagerInteropComponentDescriptor::adopt(
    ShadowNode::Unshared shadowNode) const {
  ConcreteComponentDescriptor::adopt(shadowNode);

  assert(std::dynamic_pointer_cast<LegacyViewManagerInteropShadowNode>(
      shadowNode));
  auto legacyViewManagerInteropShadowNode =
      std::static_pointer_cast<LegacyViewManagerInteropShadowNode>(shadowNode);

  auto state = LegacyViewManagerInteropState{};
  state.coordinator = _coordinator;

  legacyViewManagerInteropShadowNode->setStateData(std::move(state));
}
} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
