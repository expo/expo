/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <algorithm>
#include <iostream>
#include <memory>
#include <random>

#include <ABI42_0_0React/mounting/Differentiator.h>
#include <ABI42_0_0React/mounting/stubs.h>

#include <ABI42_0_0React/components/root/RootComponentDescriptor.h>
#include <ABI42_0_0React/components/view/ViewComponentDescriptor.h>

#include "ABI42_0_0Entropy.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

static Tag generateABI42_0_0ReactTag() {
  static Tag tag = 1000;
  return tag++;
}

class ShadowTreeEdge final {
 public:
  ShadowNode::Shared shadowNode{nullptr};
  ShadowNode::Shared parentShadowNode{nullptr};
  int index{0};
};

static bool traverseShadowTree(
    ShadowNode::Shared const &parentShadowNode,
    std::function<void(ShadowTreeEdge const &edge, bool &stop)> const
        &callback) {
  auto index = int{0};
  for (auto const &childNode : parentShadowNode->getChildren()) {
    auto stop = bool{false};

    callback(ShadowTreeEdge{childNode, parentShadowNode, index}, stop);

    if (stop) {
      return true;
    }

    if (traverseShadowTree(childNode, callback)) {
      return true;
    }

    index++;
  }
  return false;
}

static int countShadowNodes(ShadowNode::Shared const &rootShadowNode) {
  auto counter = int{0};

  traverseShadowTree(
      rootShadowNode,
      [&](ShadowTreeEdge const &edge, bool &stop) { counter++; });

  return counter;
}

static ShadowTreeEdge findShadowNodeWithIndex(
    ShadowNode::Shared const &rootNode,
    int index) {
  auto counter = int{0};
  auto result = ShadowTreeEdge{};

  traverseShadowTree(rootNode, [&](ShadowTreeEdge const &edge, bool &stop) {
    if (index == counter) {
      result = edge;
    }

    counter++;
  });

  return result;
}

static ShadowTreeEdge findRandomShadowNode(
    Entropy const &entropy,
    ShadowNode::Shared const &rootShadowNode) {
  auto count = countShadowNodes(rootShadowNode);
  return findShadowNodeWithIndex(
      rootShadowNode,
      entropy.random<int>(1 /* Excluding a root node */, count - 1));
}

static ShadowNode::ListOfShared cloneSharedShadowNodeList(
    ShadowNode::ListOfShared const &list) {
  auto result = ShadowNode::ListOfShared{};
  result.reserve(list.size());
  for (auto const &shadowNode : list) {
    result.push_back(shadowNode->clone({}));
  }
  return result;
}

static inline ShadowNode::Unshared messWithChildren(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  auto children = shadowNode.getChildren();
  children = cloneSharedShadowNodeList(children);
  entropy.shuffle(children);
  return shadowNode.clone(
      {ShadowNodeFragment::propsPlaceholder(),
       std::make_shared<ShadowNode::ListOfShared const>(children)});
}

static inline ShadowNode::Unshared messWithLayotableOnlyFlag(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  auto oldProps = shadowNode.getProps();
  auto newProps = shadowNode.getComponentDescriptor().cloneProps(
      oldProps, RawProps(folly::dynamic::object()));

  auto &viewProps =
      const_cast<ViewProps &>(static_cast<ViewProps const &>(*newProps));

  if (entropy.random<bool>(0.1)) {
    viewProps.nativeId = entropy.random<bool>() ? "42" : "";
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.backgroundColor =
        entropy.random<bool>() ? SharedColor() : whiteColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.foregroundColor =
        entropy.random<bool>() ? SharedColor() : blackColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.shadowColor =
        entropy.random<bool>() ? SharedColor() : blackColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.accessible = entropy.random<bool>();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.zIndex = entropy.random<bool>() ? 1 : 0;
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.pointerEvents = entropy.random<bool>() ? PointerEventsMode::Auto
                                                     : PointerEventsMode::None;
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.transform = entropy.random<bool>() ? Transform::Identity()
                                                 : Transform::Perspective(42);
  }

  return shadowNode.clone({newProps});
}

static inline ShadowNode::Unshared messWithYogaStyles(
    Entropy const &entropy,
    ShadowNode const &shadowNode) {
  folly::dynamic dynamic = folly::dynamic::object();

  if (entropy.random<bool>()) {
    dynamic["flexDirection"] = entropy.random<bool>() ? "row" : "column";
  }

  std::vector<std::string> properties = {
      "flex",         "flexGrow",      "flexShrink",  "flexBasis",
      "left",         "top",           "marginLeft",  "marginTop",
      "marginRight",  "marginBottom",  "paddingLeft", "paddingTop",
      "paddingRight", "paddingBottom", "width",       "height",
      "maxWidth",     "maxHeight",     "minWidth",    "minHeight",
  };

  for (auto const &property : properties) {
    if (entropy.random<bool>(0.1)) {
      dynamic[property] = entropy.random<int>(0, 1024);
    }
  }

  auto oldProps = shadowNode.getProps();
  auto newProps = shadowNode.getComponentDescriptor().cloneProps(
      oldProps, RawProps(dynamic));
  return shadowNode.clone({newProps});
}

using ShadowNodeAlteration = std::function<
    ShadowNode::Unshared(Entropy const &entropy, ShadowNode const &shadowNode)>;

static inline void alterShadowTree(
    Entropy const &entropy,
    RootShadowNode::Shared &rootShadowNode,
    ShadowNodeAlteration alteration) {
  auto edge = findRandomShadowNode(entropy, rootShadowNode);

  rootShadowNode =
      std::static_pointer_cast<RootShadowNode>(rootShadowNode->cloneTree(
          edge.shadowNode->getFamily(), [&](ShadowNode const &oldShadowNode) {
            return alteration(entropy, oldShadowNode);
          }));
}

static inline void alterShadowTree(
    Entropy const &entropy,
    RootShadowNode::Shared &rootShadowNode,
    std::vector<ShadowNodeAlteration> alterations) {
  auto i = entropy.random<int>(0, alterations.size() - 1);
  alterShadowTree(entropy, rootShadowNode, alterations[i]);
}

static SharedViewProps generateDefaultProps(
    ComponentDescriptor const &componentDescriptor) {
  return std::static_pointer_cast<ViewProps const>(
      componentDescriptor.cloneProps(nullptr, RawProps{}));
}

static inline ShadowNode::Shared generateShadowNodeTree(
    Entropy const &entropy,
    ComponentDescriptor const &componentDescriptor,
    int size,
    int deviation = 3) {
  if (size <= 1) {
    auto family = componentDescriptor.createFamily(
        {generateABI42_0_0ReactTag(), SurfaceId(1), nullptr}, nullptr);
    return componentDescriptor.createShadowNode(
        ShadowNodeFragment{generateDefaultProps(componentDescriptor)}, family);
  }

  auto items = std::vector<int>(size);
  std::fill(items.begin(), items.end(), 1);
  auto chunks = entropy.distribute(items, deviation);
  auto children = ShadowNode::ListOfShared{};

  for (auto const &chunk : chunks) {
    children.push_back(
        generateShadowNodeTree(entropy, componentDescriptor, chunk.size()));
  }

  auto family = componentDescriptor.createFamily(
      {generateABI42_0_0ReactTag(), SurfaceId(1), nullptr}, nullptr);
  return componentDescriptor.createShadowNode(
      ShadowNodeFragment{generateDefaultProps(componentDescriptor),
                         std::make_shared<SharedShadowNodeList>(children)},
      family);
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
