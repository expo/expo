/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI35_0_0YogaLayoutableShadowNode.h"

#include <algorithm>
#include <memory>

#include <ReactABI35_0_0/components/view/conversions.h>
#include <ReactABI35_0_0/core/LayoutConstraints.h>
#include <ReactABI35_0_0/core/LayoutContext.h>
#include <ReactABI35_0_0/debug/DebugStringConvertibleItem.h>
#include <ReactABI35_0_0/debug/SystraceSection.h>
#include <ABI35_0_0yoga/ABI35_0_0Yoga.h>

namespace facebook {
namespace ReactABI35_0_0 {

YogaLayoutableShadowNode::YogaLayoutableShadowNode()
    : ABI35_0_0yogaNode_({}), ABI35_0_0yogaConfig_(nullptr) {
  initializeYogaConfig(ABI35_0_0yogaConfig_);

  ABI35_0_0yogaNode_.setConfig(&ABI35_0_0yogaConfig_);
  ABI35_0_0yogaNode_.setContext(this);
  ABI35_0_0yogaNode_.setDirty(true);
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    const YogaLayoutableShadowNode &layoutableShadowNode)
    : ABI35_0_0yogaNode_(layoutableShadowNode.ABI35_0_0yogaNode_), ABI35_0_0yogaConfig_(nullptr) {
  initializeYogaConfig(ABI35_0_0yogaConfig_);

  ABI35_0_0yogaNode_.setConfig(&ABI35_0_0yogaConfig_);
  ABI35_0_0yogaNode_.setContext(this);
  ABI35_0_0yogaNode_.setOwner(nullptr);
  ABI35_0_0yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::cleanLayout() {
  ABI35_0_0yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  ABI35_0_0yogaNode_.markDirtyAndPropogate();
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !ABI35_0_0yogaNode_.isDirty();
}

bool YogaLayoutableShadowNode::getHasNewLayout() const {
  return ABI35_0_0yogaNode_.getHasNewLayout();
}

void YogaLayoutableShadowNode::setHasNewLayout(bool hasNewLayout) {
  ABI35_0_0yogaNode_.setHasNewLayout(hasNewLayout);
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  ABI35_0_0yogaNode_.setMeasureFunc(
      YogaLayoutableShadowNode::ABI35_0_0yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendChild(YogaLayoutableShadowNode *child) {
  ensureUnsealed();

  auto ABI35_0_0yogaNodeRawPtr = &ABI35_0_0yogaNode_;
  auto childYogaNodeRawPtr = &child->ABI35_0_0yogaNode_;

  if (childYogaNodeRawPtr->getOwner() != nullptr) {
    child = static_cast<YogaLayoutableShadowNode *>(
        cloneAndReplaceChild(child, ABI35_0_0yogaNode_.getChildren().size()));
    childYogaNodeRawPtr = &child->ABI35_0_0yogaNode_;
    assert(childYogaNodeRawPtr->getOwner() == nullptr);
  }

  child->ensureUnsealed();
  childYogaNodeRawPtr->setOwner(ABI35_0_0yogaNodeRawPtr);

  ABI35_0_0yogaNodeRawPtr->insertChild(
      childYogaNodeRawPtr, ABI35_0_0yogaNodeRawPtr->getChildren().size());
}

void YogaLayoutableShadowNode::setChildren(
    std::vector<YogaLayoutableShadowNode *> children) {
  ABI35_0_0yogaNode_.setChildren({});
  for (const auto &child : children) {
    appendChild(child);
  }
}

void YogaLayoutableShadowNode::setProps(const YogaStylableProps &props) {
  ABI35_0_0yogaNode_.setStyle(props.ABI35_0_0yogaStyle);
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  if (!getIsLayoutClean()) {
    ensureUnsealed();

    /*
     * In Yoga, every single Yoga Node has to have a (non-null) pointer to
     * Yoga Config (this config can be shared between many nodes),
     * so every node can be individually configured. This does *not* mean
     * however that Yoga consults with every single Yoga Node Config for every
     * config parameter. Especially in case of `pointScaleFactor`,
     * the only value in the config of the root node is taken into account
     * (and this is by design).
     */
    ABI35_0_0yogaConfig_.pointScaleFactor = layoutContext.pointScaleFactor;

    {
      SystraceSection s("YogaLayoutableShadowNode::ABI35_0_0YGNodeCalculateLayout");

      ABI35_0_0YGNodeCalculateLayout(
          &ABI35_0_0yogaNode_, ABI35_0_0YGUndefined, ABI35_0_0YGUndefined, ABI35_0_0YGDirectionInherit);
    }
  }

  LayoutableShadowNode::layout(layoutContext);
}

void YogaLayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  for (const auto &childYogaNode : ABI35_0_0yogaNode_.getChildren()) {
    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());

    LayoutMetrics childLayoutMetrics =
        layoutMetricsFromYogaNode(childNode->ABI35_0_0yogaNode_);
    childLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    childNode->setLayoutMetrics(childLayoutMetrics);
  }
}

std::vector<LayoutableShadowNode *>
YogaLayoutableShadowNode::getLayoutableChildNodes() const {
  std::vector<LayoutableShadowNode *> ABI35_0_0yogaLayoutableChildNodes;
  ABI35_0_0yogaLayoutableChildNodes.reserve(ABI35_0_0yogaNode_.getChildren().size());

  for (const auto &childYogaNode : ABI35_0_0yogaNode_.getChildren()) {
    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());
    ABI35_0_0yogaLayoutableChildNodes.push_back(childNode);
  }

  return ABI35_0_0yogaLayoutableChildNodes;
}

#pragma mark - Yoga Connectors

ABI35_0_0YGNode *YogaLayoutableShadowNode::ABI35_0_0yogaNodeCloneCallbackConnector(
    ABI35_0_0YGNode *oldYogaNode,
    ABI35_0_0YGNode *parentYogaNode,
    int childIndex) {
  SystraceSection s("YogaLayoutableShadowNode::ABI35_0_0yogaNodeCloneCallbackConnector");

  // At this point it is garanteed that all shadow nodes associated with ABI35_0_0yoga
  // nodes are `YogaLayoutableShadowNode` subclasses.
  auto parentNode =
      static_cast<YogaLayoutableShadowNode *>(parentYogaNode->getContext());
  auto oldNode =
      static_cast<YogaLayoutableShadowNode *>(oldYogaNode->getContext());
  auto clonedNode = static_cast<YogaLayoutableShadowNode *>(
      parentNode->cloneAndReplaceChild(oldNode, childIndex));
  return &clonedNode->ABI35_0_0yogaNode_;
}

ABI35_0_0YGSize YogaLayoutableShadowNode::ABI35_0_0yogaNodeMeasureCallbackConnector(
    ABI35_0_0YGNode *ABI35_0_0yogaNode,
    float width,
    ABI35_0_0YGMeasureMode widthMode,
    float height,
    ABI35_0_0YGMeasureMode heightMode) {
  SystraceSection s(
      "YogaLayoutableShadowNode::ABI35_0_0yogaNodeMeasureCallbackConnector");

  auto shadowNodeRawPtr =
      static_cast<YogaLayoutableShadowNode *>(ABI35_0_0yogaNode->getContext());

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{kFloatMax, kFloatMax};

  switch (widthMode) {
    case ABI35_0_0YGMeasureModeUndefined:
      break;
    case ABI35_0_0YGMeasureModeExactly:
      minimumSize.width = floatFromYogaFloat(width);
      maximumSize.width = floatFromYogaFloat(width);
      break;
    case ABI35_0_0YGMeasureModeAtMost:
      maximumSize.width = floatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case ABI35_0_0YGMeasureModeUndefined:
      break;
    case ABI35_0_0YGMeasureModeExactly:
      minimumSize.height = floatFromYogaFloat(height);
      maximumSize.height = floatFromYogaFloat(height);
      break;
    case ABI35_0_0YGMeasureModeAtMost:
      maximumSize.height = floatFromYogaFloat(height);
      break;
  }

  auto size = shadowNodeRawPtr->measure({minimumSize, maximumSize});

  return ABI35_0_0YGSize{ABI35_0_0yogaFloatFromFloat(size.width),
                ABI35_0_0yogaFloatFromFloat(size.height)};
}

void YogaLayoutableShadowNode::initializeYogaConfig(ABI35_0_0YGConfig &config) {
  config.cloneNodeCallback =
      YogaLayoutableShadowNode::ABI35_0_0yogaNodeCloneCallbackConnector;
}

} // namespace ReactABI35_0_0
} // namespace facebook
