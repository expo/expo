/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0YGNode.h"
#include <algorithm>
#include <iostream>
#include "ABI48_0_0CompactValue.h"
#include "ABI48_0_0Utils.h"

using namespace ABI48_0_0facebook;
using ABI48_0_0facebook::yoga::detail::CompactValue;

ABI48_0_0YGNode::ABI48_0_0YGNode(ABI48_0_0YGNode&& node) {
  context_ = node.context_;
  flags = node.flags;
  measure_ = node.measure_;
  baseline_ = node.baseline_;
  print_ = node.print_;
  dirtied_ = node.dirtied_;
  style_ = node.style_;
  layout_ = node.layout_;
  lineIndex_ = node.lineIndex_;
  owner_ = node.owner_;
  children_ = std::move(node.children_);
  config_ = node.config_;
  resolvedDimensions_ = node.resolvedDimensions_;
  for (auto c : children_) {
    c->setOwner(this);
  }
}

ABI48_0_0YGNode::ABI48_0_0YGNode(const ABI48_0_0YGNode& node, ABI48_0_0YGConfigRef config) : ABI48_0_0YGNode{node} {
  config_ = config;
  if (config->useWebDefaults) {
    useWebDefaults();
  }
}

void ABI48_0_0YGNode::print(void* printContext) {
  if (print_.noContext != nullptr) {
    if (ABI48_0_0facebook::yoga::detail::getBooleanData(flags, printUsesContext_)) {
      print_.withContext(this, printContext);
    } else {
      print_.noContext(this);
    }
  }
}

CompactValue ABI48_0_0YGNode::computeEdgeValueForRow(
    const ABI48_0_0YGStyle::Edges& edges,
    ABI48_0_0YGEdge rowEdge,
    ABI48_0_0YGEdge edge,
    CompactValue defaultValue) {
  if (!edges[rowEdge].isUndefined()) {
    return edges[rowEdge];
  } else if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[ABI48_0_0YGEdgeHorizontal].isUndefined()) {
    return edges[ABI48_0_0YGEdgeHorizontal];
  } else if (!edges[ABI48_0_0YGEdgeAll].isUndefined()) {
    return edges[ABI48_0_0YGEdgeAll];
  } else {
    return defaultValue;
  }
}

CompactValue ABI48_0_0YGNode::computeEdgeValueForColumn(
    const ABI48_0_0YGStyle::Edges& edges,
    ABI48_0_0YGEdge edge,
    CompactValue defaultValue) {
  if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[ABI48_0_0YGEdgeVertical].isUndefined()) {
    return edges[ABI48_0_0YGEdgeVertical];
  } else if (!edges[ABI48_0_0YGEdgeAll].isUndefined()) {
    return edges[ABI48_0_0YGEdgeAll];
  } else {
    return defaultValue;
  }
}

CompactValue ABI48_0_0YGNode::computeRowGap(
    const ABI48_0_0YGStyle::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[ABI48_0_0YGGutterRow].isUndefined()) {
    return gutters[ABI48_0_0YGGutterRow];
  } else if (!gutters[ABI48_0_0YGGutterAll].isUndefined()) {
    return gutters[ABI48_0_0YGGutterAll];
  } else {
    return defaultValue;
  }
}

CompactValue ABI48_0_0YGNode::computeColumnGap(
    const ABI48_0_0YGStyle::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[ABI48_0_0YGGutterColumn].isUndefined()) {
    return gutters[ABI48_0_0YGGutterColumn];
  } else if (!gutters[ABI48_0_0YGGutterAll].isUndefined()) {
    return gutters[ABI48_0_0YGGutterAll];
  } else {
    return defaultValue;
  }
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getLeadingPosition(
    const ABI48_0_0YGFlexDirection axis,
    const float axisSize) const {
  auto leadingPosition = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI48_0_0YGEdgeStart,
            leading[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), leading[axis], CompactValue::ofZero());
  return ABI48_0_0YGResolveValue(leadingPosition, axisSize);
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getTrailingPosition(
    const ABI48_0_0YGFlexDirection axis,
    const float axisSize) const {
  auto trailingPosition = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI48_0_0YGEdgeEnd,
            trailing[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), trailing[axis], CompactValue::ofZero());
  return ABI48_0_0YGResolveValue(trailingPosition, axisSize);
}

bool ABI48_0_0YGNode::isLeadingPositionDefined(const ABI48_0_0YGFlexDirection axis) const {
  auto leadingPosition = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI48_0_0YGEdgeStart,
            leading[axis],
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), leading[axis], CompactValue::ofUndefined());
  return !leadingPosition.isUndefined();
}

bool ABI48_0_0YGNode::isTrailingPosDefined(const ABI48_0_0YGFlexDirection axis) const {
  auto trailingPosition = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI48_0_0YGEdgeEnd,
            trailing[axis],
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), trailing[axis], CompactValue::ofUndefined());
  return !trailingPosition.isUndefined();
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getLeadingMargin(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto leadingMargin = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), ABI48_0_0YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), leading[axis], CompactValue::ofZero());
  return ABI48_0_0YGResolveValueMargin(leadingMargin, widthSize);
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getTrailingMargin(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto trailingMargin = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), ABI48_0_0YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), trailing[axis], CompactValue::ofZero());
  return ABI48_0_0YGResolveValueMargin(trailingMargin, widthSize);
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getMarginForAxis(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getGapForAxis(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto gap = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeColumnGap(style_.gap(), CompactValue::ofZero())
      : computeRowGap(style_.gap(), CompactValue::ofZero());
  return ABI48_0_0YGResolveValue(gap, widthSize);
}

ABI48_0_0YGSize ABI48_0_0YGNode::measure(
    float width,
    ABI48_0_0YGMeasureMode widthMode,
    float height,
    ABI48_0_0YGMeasureMode heightMode,
    void* layoutContext) {
  return ABI48_0_0facebook::yoga::detail::getBooleanData(flags, measureUsesContext_)
      ? measure_.withContext(
            this, width, widthMode, height, heightMode, layoutContext)
      : measure_.noContext(this, width, widthMode, height, heightMode);
}

float ABI48_0_0YGNode::baseline(float width, float height, void* layoutContext) {
  return ABI48_0_0facebook::yoga::detail::getBooleanData(flags, baselineUsesContext_)
      ? baseline_.withContext(this, width, height, layoutContext)
      : baseline_.noContext(this, width, height);
}

// Setters

void ABI48_0_0YGNode::setMeasureFunc(decltype(ABI48_0_0YGNode::measure_) measureFunc) {
  if (measureFunc.noContext == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI48_0_0YGNodeTypeDefault);
  } else {
    ABI48_0_0YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI48_0_0YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void ABI48_0_0YGNode::setMeasureFunc(ABI48_0_0YGMeasureFunc measureFunc) {
  ABI48_0_0facebook::yoga::detail::setBooleanData(flags, measureUsesContext_, false);
  decltype(ABI48_0_0YGNode::measure_) m;
  m.noContext = measureFunc;
  setMeasureFunc(m);
}

YOGA_EXPORT void ABI48_0_0YGNode::setMeasureFunc(MeasureWithContextFn measureFunc) {
  ABI48_0_0facebook::yoga::detail::setBooleanData(flags, measureUsesContext_, true);
  decltype(ABI48_0_0YGNode::measure_) m;
  m.withContext = measureFunc;
  setMeasureFunc(m);
}

void ABI48_0_0YGNode::replaceChild(ABI48_0_0YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void ABI48_0_0YGNode::replaceChild(ABI48_0_0YGNodeRef oldChild, ABI48_0_0YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void ABI48_0_0YGNode::insertChild(ABI48_0_0YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void ABI48_0_0YGNode::setDirty(bool isDirty) {
  if (isDirty == ABI48_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_)) {
    return;
  }
  ABI48_0_0facebook::yoga::detail::setBooleanData(flags, isDirty_, isDirty);
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool ABI48_0_0YGNode::removeChild(ABI48_0_0YGNodeRef child) {
  std::vector<ABI48_0_0YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void ABI48_0_0YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void ABI48_0_0YGNode::setLayoutDirection(ABI48_0_0YGDirection direction) {
  layout_.setDirection(direction);
}

void ABI48_0_0YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void ABI48_0_0YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void ABI48_0_0YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void ABI48_0_0YGNode::setLayoutLastOwnerDirection(ABI48_0_0YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void ABI48_0_0YGNode::setLayoutComputedFlexBasis(
    const ABI48_0_0YGFloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void ABI48_0_0YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void ABI48_0_0YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void ABI48_0_0YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void ABI48_0_0YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void ABI48_0_0YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
ABI48_0_0YGFloatOptional ABI48_0_0YGNode::relativePosition(
    const ABI48_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  ABI48_0_0YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition = ABI48_0_0YGFloatOptional{-1 * trailingPosition.unwrap()};
  }
  return trailingPosition;
}

void ABI48_0_0YGNode::setPosition(
    const ABI48_0_0YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const ABI48_0_0YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : ABI48_0_0YGDirectionLTR;
  const ABI48_0_0YGFlexDirection mainAxis =
      ABI48_0_0YGResolveFlexDirection(style_.flexDirection(), directionRespectingRoot);
  const ABI48_0_0YGFlexDirection crossAxis =
      ABI48_0_0YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  // Here we should check for `ABI48_0_0YGPositionTypeStatic` and in this case zero inset
  // properties (left, right, top, bottom, begin, end).
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const ABI48_0_0YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const ABI48_0_0YGFloatOptional relativePositionCross =
      relativePosition(crossAxis, crossSize);

  setLayoutPosition(
      (getLeadingMargin(mainAxis, ownerWidth) + relativePositionMain).unwrap(),
      leading[mainAxis]);
  setLayoutPosition(
      (getTrailingMargin(mainAxis, ownerWidth) + relativePositionMain).unwrap(),
      trailing[mainAxis]);
  setLayoutPosition(
      (getLeadingMargin(crossAxis, ownerWidth) + relativePositionCross)
          .unwrap(),
      leading[crossAxis]);
  setLayoutPosition(
      (getTrailingMargin(crossAxis, ownerWidth) + relativePositionCross)
          .unwrap(),
      trailing[crossAxis]);
}

ABI48_0_0YGValue ABI48_0_0YGNode::marginLeadingValue(const ABI48_0_0YGFlexDirection axis) const {
  if (ABI48_0_0YGFlexDirectionIsRow(axis) &&
      !style_.margin()[ABI48_0_0YGEdgeStart].isUndefined()) {
    return style_.margin()[ABI48_0_0YGEdgeStart];
  } else {
    return style_.margin()[leading[axis]];
  }
}

ABI48_0_0YGValue ABI48_0_0YGNode::marginTrailingValue(const ABI48_0_0YGFlexDirection axis) const {
  if (ABI48_0_0YGFlexDirectionIsRow(axis) && !style_.margin()[ABI48_0_0YGEdgeEnd].isUndefined()) {
    return style_.margin()[ABI48_0_0YGEdgeEnd];
  } else {
    return style_.margin()[trailing[axis]];
  }
}

ABI48_0_0YGValue ABI48_0_0YGNode::resolveFlexBasisPtr() const {
  ABI48_0_0YGValue flexBasis = style_.flexBasis();
  if (flexBasis.unit != ABI48_0_0YGUnitAuto && flexBasis.unit != ABI48_0_0YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return ABI48_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_)
        ? ABI48_0_0YGValueAuto
        : ABI48_0_0YGValueZero;
  }
  return ABI48_0_0YGValueAuto;
}

void ABI48_0_0YGNode::resolveDimension() {
  using namespace yoga;
  const ABI48_0_0YGStyle& style = getStyle();
  for (auto dim : {ABI48_0_0YGDimensionWidth, ABI48_0_0YGDimensionHeight}) {
    if (!style.maxDimensions()[dim].isUndefined() &&
        ABI48_0_0YGValueEqual(style.maxDimensions()[dim], style.minDimensions()[dim])) {
      resolvedDimensions_[dim] = style.maxDimensions()[dim];
    } else {
      resolvedDimensions_[dim] = style.dimensions()[dim];
    }
  }
}

ABI48_0_0YGDirection ABI48_0_0YGNode::resolveDirection(const ABI48_0_0YGDirection ownerDirection) {
  if (style_.direction() == ABI48_0_0YGDirectionInherit) {
    return ownerDirection > ABI48_0_0YGDirectionInherit ? ownerDirection
                                               : ABI48_0_0YGDirectionLTR;
  } else {
    return style_.direction();
  }
}

YOGA_EXPORT void ABI48_0_0YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void ABI48_0_0YGNode::cloneChildrenIfNeeded(void* cloneContext) {
  iterChildrenAfterCloningIfNeeded([](ABI48_0_0YGNodeRef, void*) {}, cloneContext);
}

void ABI48_0_0YGNode::markDirtyAndPropogate() {
  if (!ABI48_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_)) {
    setDirty(true);
    setLayoutComputedFlexBasis(ABI48_0_0YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropogate();
    }
  }
}

void ABI48_0_0YGNode::markDirtyAndPropogateDownwards() {
  ABI48_0_0facebook::yoga::detail::setBooleanData(flags, isDirty_, true);
  for_each(children_.begin(), children_.end(), [](ABI48_0_0YGNodeRef childNode) {
    childNode->markDirtyAndPropogateDownwards();
  });
}

float ABI48_0_0YGNode::resolveFlexGrow() const {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexGrow().isUndefined()) {
    return style_.flexGrow().unwrap();
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return style_.flex().unwrap();
  }
  return kDefaultFlexGrow;
}

float ABI48_0_0YGNode::resolveFlexShrink() const {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink().isUndefined()) {
    return style_.flexShrink().unwrap();
  }
  if (!ABI48_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_) &&
      !style_.flex().isUndefined() && style_.flex().unwrap() < 0.0f) {
    return -style_.flex().unwrap();
  }
  return ABI48_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_)
      ? kWebDefaultFlexShrink
      : kDefaultFlexShrink;
}

bool ABI48_0_0YGNode::isNodeFlexible() {
  return (
      (style_.positionType() != ABI48_0_0YGPositionTypeAbsolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float ABI48_0_0YGNode::getLeadingBorder(const ABI48_0_0YGFlexDirection axis) const {
  ABI48_0_0YGValue leadingBorder = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), ABI48_0_0YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), leading[axis], CompactValue::ofZero());
  return fmaxf(leadingBorder.value, 0.0f);
}

float ABI48_0_0YGNode::getTrailingBorder(const ABI48_0_0YGFlexDirection axis) const {
  ABI48_0_0YGValue trailingBorder = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), ABI48_0_0YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), trailing[axis], CompactValue::ofZero());
  return fmaxf(trailingBorder.value, 0.0f);
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getLeadingPadding(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto leadingPadding = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(),
            ABI48_0_0YGEdgeStart,
            leading[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), leading[axis], CompactValue::ofZero());
  return ABI48_0_0YGFloatOptionalMax(
      ABI48_0_0YGResolveValue(leadingPadding, widthSize), ABI48_0_0YGFloatOptional(0.0f));
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getTrailingPadding(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto trailingPadding = ABI48_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(), ABI48_0_0YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), trailing[axis], CompactValue::ofZero());
  return ABI48_0_0YGFloatOptionalMax(
      ABI48_0_0YGResolveValue(trailingPadding, widthSize), ABI48_0_0YGFloatOptional(0.0f));
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getLeadingPaddingAndBorder(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      ABI48_0_0YGFloatOptional(getLeadingBorder(axis));
}

ABI48_0_0YGFloatOptional ABI48_0_0YGNode::getTrailingPaddingAndBorder(
    const ABI48_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      ABI48_0_0YGFloatOptional(getTrailingBorder(axis));
}

bool ABI48_0_0YGNode::didUseLegacyFlag() {
  bool didUseLegacyFlag = layout_.didUseLegacyFlag();
  if (didUseLegacyFlag) {
    return true;
  }
  for (const auto& child : children_) {
    if (child->layout_.didUseLegacyFlag()) {
      didUseLegacyFlag = true;
      break;
    }
  }
  return didUseLegacyFlag;
}

void ABI48_0_0YGNode::setLayoutDoesLegacyFlagAffectsLayout(
    bool doesLegacyFlagAffectsLayout) {
  layout_.setDoesLegacyStretchFlagAffectsLayout(doesLegacyFlagAffectsLayout);
}

void ABI48_0_0YGNode::setLayoutDidUseLegacyFlag(bool didUseLegacyFlag) {
  layout_.setDidUseLegacyFlag(didUseLegacyFlag);
}

bool ABI48_0_0YGNode::isLayoutTreeEqualToNode(const ABI48_0_0YGNode& node) const {
  if (children_.size() != node.children_.size()) {
    return false;
  }
  if (layout_ != node.layout_) {
    return false;
  }
  if (children_.size() == 0) {
    return true;
  }

  bool isLayoutTreeEqual = true;
  ABI48_0_0YGNodeRef otherNodeChildren = nullptr;
  for (std::vector<ABI48_0_0YGNodeRef>::size_type i = 0; i < children_.size(); ++i) {
    otherNodeChildren = node.children_[i];
    isLayoutTreeEqual =
        children_[i]->isLayoutTreeEqualToNode(*otherNodeChildren);
    if (!isLayoutTreeEqual) {
      return false;
    }
  }
  return isLayoutTreeEqual;
}

void ABI48_0_0YGNode::reset() {
  ABI48_0_0YGAssertWithNode(
      this,
      children_.size() == 0,
      "Cannot reset a node which still has children attached");
  ABI48_0_0YGAssertWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  clearChildren();

  auto webDefaults =
      ABI48_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_);
  *this = ABI48_0_0YGNode{getConfig()};
  if (webDefaults) {
    useWebDefaults();
  }
}
