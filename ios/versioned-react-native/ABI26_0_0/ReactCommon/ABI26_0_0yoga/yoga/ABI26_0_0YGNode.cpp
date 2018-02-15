/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI26_0_0YGNode.h"
#include <iostream>

void* ABI26_0_0YGNode::getContext() const {
  return context_;
}

ABI26_0_0YGPrintFunc ABI26_0_0YGNode::getPrintFunc() const {
  return print_;
}

bool ABI26_0_0YGNode::getHasNewLayout() const {
  return hasNewLayout_;
}

ABI26_0_0YGNodeType ABI26_0_0YGNode::getNodeType() const {
  return nodeType_;
}

ABI26_0_0YGMeasureFunc ABI26_0_0YGNode::getMeasure() const {
  return measure_;
}

ABI26_0_0YGBaselineFunc ABI26_0_0YGNode::getBaseline() const {
  return baseline_;
}

ABI26_0_0YGStyle& ABI26_0_0YGNode::getStyle() {
  return style_;
}

ABI26_0_0YGLayout& ABI26_0_0YGNode::getLayout() {
  return layout_;
}

uint32_t ABI26_0_0YGNode::getLineIndex() const {
  return lineIndex_;
}

ABI26_0_0YGNodeRef ABI26_0_0YGNode::getParent() const {
  return parent_;
}

ABI26_0_0YGVector ABI26_0_0YGNode::getChildren() const {
  return children_;
}

ABI26_0_0YGNodeRef ABI26_0_0YGNode::getChild(uint32_t index) const {
  return children_.at(index);
}

ABI26_0_0YGNodeRef ABI26_0_0YGNode::getNextChild() const {
  return nextChild_;
}

ABI26_0_0YGConfigRef ABI26_0_0YGNode::getConfig() const {
  return config_;
}

bool ABI26_0_0YGNode::isDirty() const {
  return isDirty_;
}

ABI26_0_0YGValue ABI26_0_0YGNode::getResolvedDimension(int index) {
  return resolvedDimensions_[index];
}

std::array<ABI26_0_0YGValue, 2> ABI26_0_0YGNode::getResolvedDimensions() const {
  return resolvedDimensions_;
}
// Setters

void ABI26_0_0YGNode::setContext(void* context) {
  context_ = context;
}

void ABI26_0_0YGNode::setPrintFunc(ABI26_0_0YGPrintFunc printFunc) {
  print_ = printFunc;
}

void ABI26_0_0YGNode::setHasNewLayout(bool hasNewLayout) {
  hasNewLayout_ = hasNewLayout;
}

void ABI26_0_0YGNode::setNodeType(ABI26_0_0YGNodeType nodeType) {
  nodeType_ = nodeType;
}

void ABI26_0_0YGNode::setStyleFlexDirection(ABI26_0_0YGFlexDirection direction) {
  style_.flexDirection = direction;
}

void ABI26_0_0YGNode::setStyleAlignContent(ABI26_0_0YGAlign alignContent) {
  style_.alignContent = alignContent;
}

void ABI26_0_0YGNode::setMeasureFunc(ABI26_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    measure_ = nullptr;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    nodeType_ = ABI26_0_0YGNodeTypeDefault;
  } else {
    ABI26_0_0YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.");
    measure_ = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI26_0_0YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void ABI26_0_0YGNode::setBaseLineFunc(ABI26_0_0YGBaselineFunc baseLineFunc) {
  baseline_ = baseLineFunc;
}

void ABI26_0_0YGNode::setStyle(ABI26_0_0YGStyle style) {
  style_ = style;
}

void ABI26_0_0YGNode::setLayout(ABI26_0_0YGLayout layout) {
  layout_ = layout;
}

void ABI26_0_0YGNode::setLineIndex(uint32_t lineIndex) {
  lineIndex_ = lineIndex;
}

void ABI26_0_0YGNode::setParent(ABI26_0_0YGNodeRef parent) {
  parent_ = parent;
}

void ABI26_0_0YGNode::setChildren(ABI26_0_0YGVector children) {
  children_ = children;
}

void ABI26_0_0YGNode::setNextChild(ABI26_0_0YGNodeRef nextChild) {
  nextChild_ = nextChild;
}

void ABI26_0_0YGNode::replaceChild(ABI26_0_0YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void ABI26_0_0YGNode::replaceChild(ABI26_0_0YGNodeRef oldChild, ABI26_0_0YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void ABI26_0_0YGNode::insertChild(ABI26_0_0YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void ABI26_0_0YGNode::setConfig(ABI26_0_0YGConfigRef config) {
  config_ = config;
}

void ABI26_0_0YGNode::setDirty(bool isDirty) {
  isDirty_ = isDirty;
}

bool ABI26_0_0YGNode::removeChild(ABI26_0_0YGNodeRef child) {
  std::vector<ABI26_0_0YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void ABI26_0_0YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void ABI26_0_0YGNode::setLayoutDirection(ABI26_0_0YGDirection direction) {
  layout_.direction = direction;
}

void ABI26_0_0YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void ABI26_0_0YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void ABI26_0_0YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void ABI26_0_0YGNode::setLayoutLastParentDirection(ABI26_0_0YGDirection direction) {
  layout_.lastParentDirection = direction;
}

void ABI26_0_0YGNode::setLayoutComputedFlexBasis(float computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void ABI26_0_0YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void ABI26_0_0YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void ABI26_0_0YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void ABI26_0_0YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.hadOverflow = hadOverflow;
}

void ABI26_0_0YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

ABI26_0_0YGNode::ABI26_0_0YGNode()
    : context_(nullptr),
      print_(nullptr),
      hasNewLayout_(true),
      nodeType_(ABI26_0_0YGNodeTypeDefault),
      measure_(nullptr),
      baseline_(nullptr),
      style_(gABI26_0_0YGNodeStyleDefaults),
      layout_(gABI26_0_0YGNodeLayoutDefaults),
      lineIndex_(0),
      parent_(nullptr),
      children_(ABI26_0_0YGVector()),
      nextChild_(nullptr),
      config_(nullptr),
      isDirty_(false),
      resolvedDimensions_({{ABI26_0_0YGValueUndefined, ABI26_0_0YGValueUndefined}}) {}

ABI26_0_0YGNode::ABI26_0_0YGNode(const ABI26_0_0YGNode& node)
    : context_(node.context_),
      print_(node.print_),
      hasNewLayout_(node.hasNewLayout_),
      nodeType_(node.nodeType_),
      measure_(node.measure_),
      baseline_(node.baseline_),
      style_(node.style_),
      layout_(node.layout_),
      lineIndex_(node.lineIndex_),
      parent_(node.parent_),
      children_(node.children_),
      nextChild_(node.nextChild_),
      config_(node.config_),
      isDirty_(node.isDirty_),
      resolvedDimensions_(node.resolvedDimensions_) {}

ABI26_0_0YGNode::ABI26_0_0YGNode(const ABI26_0_0YGConfigRef newConfig) : ABI26_0_0YGNode() {
  config_ = newConfig;
}

ABI26_0_0YGNode::ABI26_0_0YGNode(
    void* context,
    ABI26_0_0YGPrintFunc print,
    bool hasNewLayout,
    ABI26_0_0YGNodeType nodeType,
    ABI26_0_0YGMeasureFunc measure,
    ABI26_0_0YGBaselineFunc baseline,
    ABI26_0_0YGStyle style,
    ABI26_0_0YGLayout layout,
    uint32_t lineIndex,
    ABI26_0_0YGNodeRef parent,
    ABI26_0_0YGVector children,
    ABI26_0_0YGNodeRef nextChild,
    ABI26_0_0YGConfigRef config,
    bool isDirty,
    std::array<ABI26_0_0YGValue, 2> resolvedDimensions)
    : context_(context),
      print_(print),
      hasNewLayout_(hasNewLayout),
      nodeType_(nodeType),
      measure_(measure),
      baseline_(baseline),
      style_(style),
      layout_(layout),
      lineIndex_(lineIndex),
      parent_(parent),
      children_(children),
      nextChild_(nextChild),
      config_(config),
      isDirty_(isDirty),
      resolvedDimensions_(resolvedDimensions) {}

ABI26_0_0YGNode& ABI26_0_0YGNode::operator=(const ABI26_0_0YGNode& node) {
  if (&node == this) {
    return *this;
  }

  for (auto child : children_) {
    delete child;
  }

  context_ = node.getContext();
  print_ = node.getPrintFunc();
  hasNewLayout_ = node.getHasNewLayout();
  nodeType_ = node.getNodeType();
  measure_ = node.getMeasure();
  baseline_ = node.getBaseline();
  style_ = node.style_;
  layout_ = node.layout_;
  lineIndex_ = node.getLineIndex();
  parent_ = node.getParent();
  children_ = node.getChildren();
  nextChild_ = node.getNextChild();
  config_ = node.getConfig();
  isDirty_ = node.isDirty();
  resolvedDimensions_ = node.getResolvedDimensions();

  return *this;
}

ABI26_0_0YGValue ABI26_0_0YGNode::marginLeadingValue(const ABI26_0_0YGFlexDirection axis) const {
  if (ABI26_0_0YGFlexDirectionIsRow(axis) &&
      style_.margin[ABI26_0_0YGEdgeStart].unit != ABI26_0_0YGUnitUndefined) {
    return style_.margin[ABI26_0_0YGEdgeStart];
  } else {
    return style_.margin[leading[axis]];
  }
}

ABI26_0_0YGValue ABI26_0_0YGNode::marginTrailingValue(const ABI26_0_0YGFlexDirection axis) const {
  if (ABI26_0_0YGFlexDirectionIsRow(axis) &&
      style_.margin[ABI26_0_0YGEdgeEnd].unit != ABI26_0_0YGUnitUndefined) {
    return style_.margin[ABI26_0_0YGEdgeEnd];
  } else {
    return style_.margin[trailing[axis]];
  }
}

ABI26_0_0YGValue ABI26_0_0YGNode::resolveFlexBasisPtr() const {
  ABI26_0_0YGValue flexBasis = style_.flexBasis;
  if (flexBasis.unit != ABI26_0_0YGUnitAuto && flexBasis.unit != ABI26_0_0YGUnitUndefined) {
    return flexBasis;
  }
  if (!ABI26_0_0YGFloatIsUndefined(style_.flex) && style_.flex > 0.0f) {
    return config_->useWebDefaults ? ABI26_0_0YGValueAuto : ABI26_0_0YGValueZero;
  }
  return ABI26_0_0YGValueAuto;
}

void ABI26_0_0YGNode::resolveDimension() {
  for (uint32_t dim = ABI26_0_0YGDimensionWidth; dim < ABI26_0_0YGDimensionCount; dim++) {
    if (getStyle().maxDimensions[dim].unit != ABI26_0_0YGUnitUndefined &&
        ABI26_0_0YGValueEqual(
            getStyle().maxDimensions[dim], style_.minDimensions[dim])) {
      resolvedDimensions_[dim] = style_.maxDimensions[dim];
    } else {
      resolvedDimensions_[dim] = style_.dimensions[dim];
    }
  }
}

void ABI26_0_0YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

ABI26_0_0YGNode::~ABI26_0_0YGNode() {
  // All the member variables are deallocated externally, so no need to
  // deallocate here
}

// Other Methods

void ABI26_0_0YGNode::cloneChildrenIfNeeded() {
  // ABI26_0_0YGNodeRemoveChild in yoga.cpp has a forked variant of this algorithm
  // optimized for deletions.

  const uint32_t childCount = static_cast<uint32_t>(children_.size());
  if (childCount == 0) {
    // This is an empty set. Nothing to clone.
    return;
  }

  const ABI26_0_0YGNodeRef firstChild = children_.front();
  if (firstChild->getParent() == this) {
    // If the first child has this node as its parent, we assume that it is
    // already unique. We can do this because if we have it has a child, that
    // means that its parent was at some point cloned which made that subtree
    // immutable. We also assume that all its sibling are cloned as well.
    return;
  }

  const ABI26_0_0YGNodeClonedFunc cloneNodeCallback = config_->cloneNodeCallback;
  for (uint32_t i = 0; i < childCount; ++i) {
    const ABI26_0_0YGNodeRef oldChild = children_[i];
    const ABI26_0_0YGNodeRef newChild = ABI26_0_0YGNodeClone(oldChild);
    replaceChild(newChild, i);
    newChild->setParent(this);
    if (cloneNodeCallback) {
      cloneNodeCallback(oldChild, newChild, this, i);
    }
  }
}

void ABI26_0_0YGNode::markDirtyAndPropogate() {
  if (!isDirty_) {
    isDirty_ = true;
    setLayoutComputedFlexBasis(ABI26_0_0YGUndefined);
    if (parent_) {
      parent_->markDirtyAndPropogate();
    }
  }
}

float ABI26_0_0YGNode::resolveFlexGrow() {
  // Root nodes flexGrow should always be 0
  if (parent_ == nullptr) {
    return 0.0;
  }
  if (!ABI26_0_0YGFloatIsUndefined(style_.flexGrow)) {
    return style_.flexGrow;
  }
  if (!ABI26_0_0YGFloatIsUndefined(style_.flex) && style_.flex > 0.0f) {
    return style_.flex;
  }
  return kDefaultFlexGrow;
}

float ABI26_0_0YGNode::resolveFlexShrink() {
  if (parent_ == nullptr) {
    return 0.0;
  }
  if (!ABI26_0_0YGFloatIsUndefined(style_.flexShrink)) {
    return style_.flexShrink;
  }
  if (!config_->useWebDefaults && !ABI26_0_0YGFloatIsUndefined(style_.flex) &&
      style_.flex < 0.0f) {
    return -style_.flex;
  }
  return config_->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}
