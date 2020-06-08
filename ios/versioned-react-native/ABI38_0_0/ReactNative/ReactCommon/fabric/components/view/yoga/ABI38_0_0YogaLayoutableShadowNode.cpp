/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0YogaLayoutableShadowNode.h"

#include <algorithm>
#include <limits>
#include <memory>

#include <ABI38_0_0React/components/view/conversions.h>
#include <ABI38_0_0React/core/LayoutConstraints.h>
#include <ABI38_0_0React/core/LayoutContext.h>
#include <ABI38_0_0React/debug/DebugStringConvertibleItem.h>
#include <ABI38_0_0React/debug/SystraceSection.h>
#include <ABI38_0_0yoga/ABI38_0_0Yoga.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

YogaLayoutableShadowNode::YogaLayoutableShadowNode(bool isLeaf)
    : yogaConfig_(nullptr),
      yogaNode_(&initializeYogaConfig(yogaConfig_)),
      isLeaf_(isLeaf) {
  yogaNode_.setContext(this);
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    YogaLayoutableShadowNode const &layoutableShadowNode)
    : LayoutableShadowNode(layoutableShadowNode),
      yogaConfig_(nullptr),
      yogaNode_(
          layoutableShadowNode.yogaNode_,
          &initializeYogaConfig(yogaConfig_)),
      isLeaf_(layoutableShadowNode.isLeaf_) {
  yogaNode_.setContext(this);
  yogaNode_.setOwner(nullptr);

  // Yoga node must inherit dirty flag.
  assert(layoutableShadowNode.yogaNode_.isDirty() == yogaNode_.isDirty());
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_.setDirty(true);
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !yogaNode_.isDirty();
}

bool YogaLayoutableShadowNode::getHasNewLayout() const {
  return yogaNode_.getHasNewLayout();
}

void YogaLayoutableShadowNode::setHasNewLayout(bool hasNewLayout) {
  yogaNode_.setHasNewLayout(hasNewLayout);
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  yogaNode_.setMeasureFunc(
      YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendChild(YogaLayoutableShadowNode *child) {
  if (isLeaf_) {
    return;
  }

  ensureUnsealed();

  yogaNode_.setDirty(true);

  auto yogaNodeRawPtr = &yogaNode_;
  auto childYogaNodeRawPtr = &child->yogaNode_;

  if (childYogaNodeRawPtr->getOwner() != nullptr) {
    child = static_cast<YogaLayoutableShadowNode *>(
        cloneAndReplaceChild(child, yogaNode_.getChildren().size()));
    childYogaNodeRawPtr = &child->yogaNode_;
  }

  // Inserted node must have a clear owner (must not be shared).
  assert(childYogaNodeRawPtr->getOwner() == nullptr);

  child->ensureUnsealed();
  childYogaNodeRawPtr->setOwner(yogaNodeRawPtr);

  yogaNodeRawPtr->insertChild(
      childYogaNodeRawPtr, yogaNodeRawPtr->getChildren().size());
}

void YogaLayoutableShadowNode::setChildren(
    YogaLayoutableShadowNode::UnsharedList children) {
  if (isLeaf_) {
    return;
  }

  ensureUnsealed();

  // Optimization:
  // If the new list of child nodes consists of clean nodes, and if their styles
  // are identical to styles of old children, we don't dirty the node.
  bool isClean = !yogaNode_.getDirtied() &&
      children.size() == yogaNode_.getChildren().size();
  auto oldChildren = isClean ? yogaNode_.getChildren() : ABI38_0_0YGVector{};

  yogaNode_.setChildren({});

  auto i = int{0};
  for (auto const &child : children) {
    appendChild(child);

    isClean = isClean && !child->yogaNode_.isDirty() &&
        child->yogaNode_.getStyle() == oldChildren[i++]->getStyle();
  }

  yogaNode_.setDirty(!isClean);
}

void YogaLayoutableShadowNode::setProps(const YogaStylableProps &props) {
  ensureUnsealed();

  // Resetting `dirty` flag only if `yogaStyle` portion of `Props` was changed.
  if (!yogaNode_.isDirty() && (props.yogaStyle != yogaNode_.getStyle())) {
    yogaNode_.setDirty(true);
  }

  yogaNode_.setStyle(props.yogaStyle);
}

void YogaLayoutableShadowNode::setSize(Size size) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.dimensions()[ABI38_0_0YGDimensionWidth] = yogaStyleValueFromFloat(size.width);
  style.dimensions()[ABI38_0_0YGDimensionHeight] = yogaStyleValueFromFloat(size.height);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPadding(RectangleEdges<Float> padding) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.padding()[ABI38_0_0YGEdgeTop] = yogaStyleValueFromFloat(padding.top);
  style.padding()[ABI38_0_0YGEdgeLeft] = yogaStyleValueFromFloat(padding.left);
  style.padding()[ABI38_0_0YGEdgeRight] = yogaStyleValueFromFloat(padding.right);
  style.padding()[ABI38_0_0YGEdgeBottom] = yogaStyleValueFromFloat(padding.bottom);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPositionType(
    ABI38_0_0YGPositionType positionType) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.positionType() = positionType;
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
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
    yogaConfig_.pointScaleFactor = layoutContext.pointScaleFactor;

    {
      SystraceSection s("YogaLayoutableShadowNode::ABI38_0_0YGNodeCalculateLayout");

      ABI38_0_0YGNodeCalculateLayout(
          &yogaNode_, ABI38_0_0YGUndefined, ABI38_0_0YGUndefined, ABI38_0_0YGDirectionInherit);
    }
  }

  LayoutableShadowNode::layout(layoutContext);
}

void YogaLayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  for (const auto &childYogaNode : yogaNode_.getChildren()) {
    if (!childYogaNode->getHasNewLayout()) {
      continue;
    }

    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());

    // Verifying that the Yoga node belongs to the ShadowNode.
    assert(&childNode->yogaNode_ == childYogaNode);

    LayoutMetrics childLayoutMetrics =
        layoutMetricsFromYogaNode(childNode->yogaNode_);
    childLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;

    // We must copy layout metrics from Yoga node only once (when the parent
    // node exclusively ownes the child node).
    assert(childYogaNode->getOwner() == &yogaNode_);

    childNode->ensureUnsealed();
    auto affected = childNode->setLayoutMetrics(childLayoutMetrics);

    if (affected && layoutContext.affectedNodes) {
      layoutContext.affectedNodes->push_back(childNode);
    }
  }
}

LayoutableShadowNode::UnsharedList
YogaLayoutableShadowNode::getLayoutableChildNodes() const {
  LayoutableShadowNode::UnsharedList yogaLayoutableChildNodes;
  yogaLayoutableChildNodes.reserve(yogaNode_.getChildren().size());

  for (const auto &childYogaNode : yogaNode_.getChildren()) {
    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());
    yogaLayoutableChildNodes.push_back(childNode);
  }

  return yogaLayoutableChildNodes;
}

#pragma mark - Yoga Connectors

ABI38_0_0YGNode *YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(
    ABI38_0_0YGNode *oldYogaNode,
    ABI38_0_0YGNode *parentYogaNode,
    int childIndex) {
  SystraceSection s("YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector");

  // At this point it is guaranteed that all shadow nodes associated with yoga
  // nodes are `YogaLayoutableShadowNode` subclasses.
  auto parentNode =
      static_cast<YogaLayoutableShadowNode *>(parentYogaNode->getContext());
  auto oldNode =
      static_cast<YogaLayoutableShadowNode *>(oldYogaNode->getContext());
  auto clonedNode = static_cast<YogaLayoutableShadowNode *>(
      parentNode->cloneAndReplaceChild(oldNode, childIndex));
  return &clonedNode->yogaNode_;
}

ABI38_0_0YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(
    ABI38_0_0YGNode *yogaNode,
    float width,
    ABI38_0_0YGMeasureMode widthMode,
    float height,
    ABI38_0_0YGMeasureMode heightMode) {
  SystraceSection s(
      "YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector");

  auto shadowNodeRawPtr =
      static_cast<YogaLayoutableShadowNode *>(yogaNode->getContext());

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{std::numeric_limits<Float>::infinity(),
                          std::numeric_limits<Float>::infinity()};

  switch (widthMode) {
    case ABI38_0_0YGMeasureModeUndefined:
      break;
    case ABI38_0_0YGMeasureModeExactly:
      minimumSize.width = floatFromYogaFloat(width);
      maximumSize.width = floatFromYogaFloat(width);
      break;
    case ABI38_0_0YGMeasureModeAtMost:
      maximumSize.width = floatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case ABI38_0_0YGMeasureModeUndefined:
      break;
    case ABI38_0_0YGMeasureModeExactly:
      minimumSize.height = floatFromYogaFloat(height);
      maximumSize.height = floatFromYogaFloat(height);
      break;
    case ABI38_0_0YGMeasureModeAtMost:
      maximumSize.height = floatFromYogaFloat(height);
      break;
  }

  auto size = shadowNodeRawPtr->measure({minimumSize, maximumSize});

  return ABI38_0_0YGSize{yogaFloatFromFloat(size.width),
                yogaFloatFromFloat(size.height)};
}

ABI38_0_0YGConfig &YogaLayoutableShadowNode::initializeYogaConfig(ABI38_0_0YGConfig &config) {
  config.setCloneNodeCallback(
      YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector);
  config.useLegacyStretchBehaviour = true;
  return config;
}

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
