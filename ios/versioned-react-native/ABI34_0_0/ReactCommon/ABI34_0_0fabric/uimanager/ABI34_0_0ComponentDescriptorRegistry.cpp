// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ABI34_0_0ComponentDescriptorRegistry.h"

#include <ReactABI34_0_0/core/ShadowNodeFragment.h>
#include <ReactABI34_0_0/uimanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

void ComponentDescriptorRegistry::registerComponentDescriptor(
    SharedComponentDescriptor componentDescriptor) {
  ComponentHandle componentHandle = componentDescriptor->getComponentHandle();
  _registryByHandle[componentHandle] = componentDescriptor;

  ComponentName componentName = componentDescriptor->getComponentName();
  _registryByName[componentName] = componentDescriptor;
}

const SharedComponentDescriptor ComponentDescriptorRegistry::operator[](
    const SharedShadowNode &shadowNode) const {
  ComponentHandle componentHandle = shadowNode->getComponentHandle();
  return _registryByHandle.at(componentHandle);
}

const SharedComponentDescriptor ComponentDescriptorRegistry::operator[](
    const ComponentName &componentName) const {
  auto it = _registryByName.find(componentName);
  if (it == _registryByName.end()) {
    throw std::invalid_argument(
        ("Unable to find componentDescriptor for " + componentName).c_str());
  }
  return it->second;
}

static const std::string componentNameByReactABI34_0_0ViewName(std::string viewName) {
  // We need this function only for the transition period;
  // eventually, all names will be unified.

  std::string rctPrefix("ABI34_0_0RCT");
  if (std::mismatch(rctPrefix.begin(), rctPrefix.end(), viewName.begin())
          .first == rctPrefix.end()) {
    // If `viewName` has "ABI34_0_0RCT" prefix, remove it.
    viewName.erase(0, rctPrefix.length());
  }

  // Fabric uses slightly new names for Text components because of differences
  // in semantic.
  if (viewName == "Text") {
    return "Paragraph";
  }
  if (viewName == "VirtualText") {
    return "Text";
  }

  if (viewName == "ImageView") {
    return "Image";
  }

  if (viewName == "AndroidHorizontalScrollView") {
    return "ScrollView";
  }

  if (viewName == "RKShimmeringView") {
    return "ShimmeringView";
  }

  if (viewName == "AndroidProgressBar") {
    return "ActivityIndicatorView";
  }

  // We need this temporarly for testing purposes until we have proper
  // implementation of core components.
  if (viewName == "SinglelineTextInputView" ||
      viewName == "MultilineTextInputView" || viewName == "AndroidTextInput" ||
      viewName == "RefreshControl" || viewName == "AndroidSwipeRefreshLayout" ||
      viewName == "SafeAreaView" || viewName == "ScrollContentView" ||
      viewName == "AndroidHorizontalScrollContentView" // Android
  ) {
    return "View";
  }

  return viewName;
}

const ComponentDescriptor &ComponentDescriptorRegistry::at(
    ComponentName componentName) const {
  auto unifiedComponentName = componentNameByReactABI34_0_0ViewName(componentName);

  auto it = _registryByName.find(unifiedComponentName);
  if (it == _registryByName.end()) {
    throw std::invalid_argument(
        ("Unable to find componentDescriptor for " + unifiedComponentName)
            .c_str());
  }
  return *it->second;
}

const ComponentDescriptor &ComponentDescriptorRegistry::at(
    ComponentHandle componentHandle) const {
  return *_registryByHandle.at(componentHandle);
}

SharedShadowNode ComponentDescriptorRegistry::createNode(
    Tag tag,
    const std::string &viewName,
    Tag rootTag,
    const folly::dynamic &props,
    const SharedEventTarget &eventTarget) const {
  ComponentName componentName = componentNameByReactABI34_0_0ViewName(viewName);
  const SharedComponentDescriptor &componentDescriptor = (*this)[componentName];

  SharedShadowNode shadowNode = componentDescriptor->createShadowNode(
      {.tag = tag,
       .rootTag = rootTag,
       .eventEmitter =
           componentDescriptor->createEventEmitter(std::move(eventTarget), tag),
       .props = componentDescriptor->cloneProps(nullptr, RawProps(props))});
  return shadowNode;
}

} // namespace ReactABI34_0_0
} // namespace facebook
