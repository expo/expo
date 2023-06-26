/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0YGNode.h"
#include <algorithm>
#include <iostream>
#include "ABI49_0_0CompactValue.h"
#include "ABI49_0_0Utils.h"

using namespace ABI49_0_0facebook;
using ABI49_0_0facebook::yoga::detail::CompactValue;

ABI49_0_0YGNode::ABI49_0_0YGNode(ABI49_0_0YGNode&& node) {
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

ABI49_0_0YGNode::ABI49_0_0YGNode(const ABI49_0_0YGNode& node, ABI49_0_0YGConfigRef config) : ABI49_0_0YGNode{node} {
  config_ = config;
  if (config->useWebDefaults) {
    useWebDefaults();
  }
}

void ABI49_0_0YGNode::print(void* printContext) {
  if (print_.noContext != nullptr) {
    if (ABI49_0_0facebook::yoga::detail::getBooleanData(flags, printUsesContext_)) {
      print_.withContext(this, printContext);
    } else {
      print_.noContext(this);
    }
  }
}

CompactValue ABI49_0_0YGNode::computeEdgeValueForRow(
    const ABI49_0_0YGStyle::Edges& edges,
    ABI49_0_0YGEdge rowEdge,
    ABI49_0_0YGEdge edge,
    CompactValue defaultValue) {
  if (!edges[rowEdge].isUndefined()) {
    return edges[rowEdge];
  } else if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[ABI49_0_0YGEdgeHorizontal].isUndefined()) {
    return edges[ABI49_0_0YGEdgeHorizontal];
  } else if (!edges[ABI49_0_0YGEdgeAll].isUndefined()) {
    return edges[ABI49_0_0YGEdgeAll];
  } else {
    return defaultValue;
  }
}

CompactValue ABI49_0_0YGNode::computeEdgeValueForColumn(
    const ABI49_0_0YGStyle::Edges& edges,
    ABI49_0_0YGEdge edge,
    CompactValue defaultValue) {
  if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[ABI49_0_0YGEdgeVertical].isUndefined()) {
    return edges[ABI49_0_0YGEdgeVertical];
  } else if (!edges[ABI49_0_0YGEdgeAll].isUndefined()) {
    return edges[ABI49_0_0YGEdgeAll];
  } else {
    return defaultValue;
  }
}

CompactValue ABI49_0_0YGNode::computeRowGap(
    const ABI49_0_0YGStyle::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[ABI49_0_0YGGutterRow].isUndefined()) {
    return gutters[ABI49_0_0YGGutterRow];
  } else if (!gutters[ABI49_0_0YGGutterAll].isUndefined()) {
    return gutters[ABI49_0_0YGGutterAll];
  } else {
    return defaultValue;
  }
}

CompactValue ABI49_0_0YGNode::computeColumnGap(
    const ABI49_0_0YGStyle::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[ABI49_0_0YGGutterColumn].isUndefined()) {
    return gutters[ABI49_0_0YGGutterColumn];
  } else if (!gutters[ABI49_0_0YGGutterAll].isUndefined()) {
    return gutters[ABI49_0_0YGGutterAll];
  } else {
    return defaultValue;
  }
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getLeadingPosition(
    const ABI49_0_0YGFlexDirection axis,
    const float axisSize) const {
  auto leadingPosition = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI49_0_0YGEdgeStart,
            leading[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), leading[axis], CompactValue::ofZero());
  return ABI49_0_0YGResolveValue(leadingPosition, axisSize);
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getTrailingPosition(
    const ABI49_0_0YGFlexDirection axis,
    const float axisSize) const {
  auto trailingPosition = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI49_0_0YGEdgeEnd,
            trailing[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), trailing[axis], CompactValue::ofZero());
  return ABI49_0_0YGResolveValue(trailingPosition, axisSize);
}

bool ABI49_0_0YGNode::isLeadingPositionDefined(const ABI49_0_0YGFlexDirection axis) const {
  auto leadingPosition = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI49_0_0YGEdgeStart,
            leading[axis],
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), leading[axis], CompactValue::ofUndefined());
  return !leadingPosition.isUndefined();
}

bool ABI49_0_0YGNode::isTrailingPosDefined(const ABI49_0_0YGFlexDirection axis) const {
  auto trailingPosition = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            ABI49_0_0YGEdgeEnd,
            trailing[axis],
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), trailing[axis], CompactValue::ofUndefined());
  return !trailingPosition.isUndefined();
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getLeadingMargin(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto leadingMargin = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), ABI49_0_0YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), leading[axis], CompactValue::ofZero());
  return ABI49_0_0YGResolveValueMargin(leadingMargin, widthSize);
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getTrailingMargin(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto trailingMargin = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), ABI49_0_0YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), trailing[axis], CompactValue::ofZero());
  return ABI49_0_0YGResolveValueMargin(trailingMargin, widthSize);
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getMarginForAxis(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getGapForAxis(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto gap = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeColumnGap(style_.gap(), CompactValue::ofZero())
      : computeRowGap(style_.gap(), CompactValue::ofZero());
  return ABI49_0_0YGResolveValue(gap, widthSize);
}

ABI49_0_0YGSize ABI49_0_0YGNode::measure(
    float width,
    ABI49_0_0YGMeasureMode widthMode,
    float height,
    ABI49_0_0YGMeasureMode heightMode,
    void* layoutContext) {
  return ABI49_0_0facebook::yoga::detail::getBooleanData(flags, measureUsesContext_)
      ? measure_.withContext(
            this, width, widthMode, height, heightMode, layoutContext)
      : measure_.noContext(this, width, widthMode, height, heightMode);
}

float ABI49_0_0YGNode::baseline(float width, float height, void* layoutContext) {
  return ABI49_0_0facebook::yoga::detail::getBooleanData(flags, baselineUsesContext_)
      ? baseline_.withContext(this, width, height, layoutContext)
      : baseline_.noContext(this, width, height);
}

// Setters

void ABI49_0_0YGNode::setMeasureFunc(decltype(ABI49_0_0YGNode::measure_) measureFunc) {
  if (measureFunc.noContext == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI49_0_0YGNodeTypeDefault);
  } else {
    ABI49_0_0YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI49_0_0YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void ABI49_0_0YGNode::setMeasureFunc(ABI49_0_0YGMeasureFunc measureFunc) {
  ABI49_0_0facebook::yoga::detail::setBooleanData(flags, measureUsesContext_, false);
  decltype(ABI49_0_0YGNode::measure_) m;
  m.noContext = measureFunc;
  setMeasureFunc(m);
}

YOGA_EXPORT void ABI49_0_0YGNode::setMeasureFunc(MeasureWithContextFn measureFunc) {
  ABI49_0_0facebook::yoga::detail::setBooleanData(flags, measureUsesContext_, true);
  decltype(ABI49_0_0YGNode::measure_) m;
  m.withContext = measureFunc;
  setMeasureFunc(m);
}

void ABI49_0_0YGNode::replaceChild(ABI49_0_0YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void ABI49_0_0YGNode::replaceChild(ABI49_0_0YGNodeRef oldChild, ABI49_0_0YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void ABI49_0_0YGNode::insertChild(ABI49_0_0YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void ABI49_0_0YGNode::setDirty(bool isDirty) {
  if (isDirty == ABI49_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_)) {
    return;
  }
  ABI49_0_0facebook::yoga::detail::setBooleanData(flags, isDirty_, isDirty);
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool ABI49_0_0YGNode::removeChild(ABI49_0_0YGNodeRef child) {
  std::vector<ABI49_0_0YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void ABI49_0_0YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void ABI49_0_0YGNode::setLayoutDirection(ABI49_0_0YGDirection direction) {
  layout_.setDirection(direction);
}

void ABI49_0_0YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void ABI49_0_0YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void ABI49_0_0YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void ABI49_0_0YGNode::setLayoutLastOwnerDirection(ABI49_0_0YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void ABI49_0_0YGNode::setLayoutComputedFlexBasis(
    const ABI49_0_0YGFloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void ABI49_0_0YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void ABI49_0_0YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void ABI49_0_0YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void ABI49_0_0YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void ABI49_0_0YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
ABI49_0_0YGFloatOptional ABI49_0_0YGNode::relativePosition(
    const ABI49_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  ABI49_0_0YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition = ABI49_0_0YGFloatOptional{-1 * trailingPosition.unwrap()};
  }
  return trailingPosition;
}

void ABI49_0_0YGNode::setPosition(
    const ABI49_0_0YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const ABI49_0_0YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : ABI49_0_0YGDirectionLTR;
  const ABI49_0_0YGFlexDirection mainAxis =
      ABI49_0_0YGResolveFlexDirection(style_.flexDirection(), directionRespectingRoot);
  const ABI49_0_0YGFlexDirection crossAxis =
      ABI49_0_0YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  // Here we should check for `ABI49_0_0YGPositionTypeStatic` and in this case zero inset
  // properties (left, right, top, bottom, begin, end).
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const ABI49_0_0YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const ABI49_0_0YGFloatOptional relativePositionCross =
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

ABI49_0_0YGValue ABI49_0_0YGNode::marginLeadingValue(const ABI49_0_0YGFlexDirection axis) const {
  if (ABI49_0_0YGFlexDirectionIsRow(axis) &&
      !style_.margin()[ABI49_0_0YGEdgeStart].isUndefined()) {
    return style_.margin()[ABI49_0_0YGEdgeStart];
  } else {
    return style_.margin()[leading[axis]];
  }
}

ABI49_0_0YGValue ABI49_0_0YGNode::marginTrailingValue(const ABI49_0_0YGFlexDirection axis) const {
  if (ABI49_0_0YGFlexDirectionIsRow(axis) && !style_.margin()[ABI49_0_0YGEdgeEnd].isUndefined()) {
    return style_.margin()[ABI49_0_0YGEdgeEnd];
  } else {
    return style_.margin()[trailing[axis]];
  }
}

ABI49_0_0YGValue ABI49_0_0YGNode::resolveFlexBasisPtr() const {
  ABI49_0_0YGValue flexBasis = style_.flexBasis();
  if (flexBasis.unit != ABI49_0_0YGUnitAuto && flexBasis.unit != ABI49_0_0YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return ABI49_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_)
        ? ABI49_0_0YGValueAuto
        : ABI49_0_0YGValueZero;
  }
  return ABI49_0_0YGValueAuto;
}

void ABI49_0_0YGNode::resolveDimension() {
  using namespace yoga;
  const ABI49_0_0YGStyle& style = getStyle();
  for (auto dim : {ABI49_0_0YGDimensionWidth, ABI49_0_0YGDimensionHeight}) {
    if (!style.maxDimensions()[dim].isUndefined() &&
        ABI49_0_0YGValueEqual(style.maxDimensions()[dim], style.minDimensions()[dim])) {
      resolvedDimensions_[dim] = style.maxDimensions()[dim];
    } else {
      resolvedDimensions_[dim] = style.dimensions()[dim];
    }
  }
}

ABI49_0_0YGDirection ABI49_0_0YGNode::resolveDirection(const ABI49_0_0YGDirection ownerDirection) {
  if (style_.direction() == ABI49_0_0YGDirectionInherit) {
    return ownerDirection > ABI49_0_0YGDirectionInherit ? ownerDirection
                                               : ABI49_0_0YGDirectionLTR;
  } else {
    return style_.direction();
  }
}

YOGA_EXPORT void ABI49_0_0YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void ABI49_0_0YGNode::cloneChildrenIfNeeded(void* cloneContext) {
  iterChildrenAfterCloningIfNeeded([](ABI49_0_0YGNodeRef, void*) {}, cloneContext);
}

void ABI49_0_0YGNode::markDirtyAndPropogate() {
  if (!ABI49_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_)) {
    setDirty(true);
    setLayoutComputedFlexBasis(ABI49_0_0YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropogate();
    }
  }
}

void ABI49_0_0YGNode::markDirtyAndPropogateDownwards() {
  ABI49_0_0facebook::yoga::detail::setBooleanData(flags, isDirty_, true);
  for_each(children_.begin(), children_.end(), [](ABI49_0_0YGNodeRef childNode) {
    childNode->markDirtyAndPropogateDownwards();
  });
}

float ABI49_0_0YGNode::resolveFlexGrow() const {
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

float ABI49_0_0YGNode::resolveFlexShrink() const {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink().isUndefined()) {
    return style_.flexShrink().unwrap();
  }
  if (!ABI49_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_) &&
      !style_.flex().isUndefined() && style_.flex().unwrap() < 0.0f) {
    return -style_.flex().unwrap();
  }
  return ABI49_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_)
      ? kWebDefaultFlexShrink
      : kDefaultFlexShrink;
}

bool ABI49_0_0YGNode::isNodeFlexible() {
  return (
      (style_.positionType() != ABI49_0_0YGPositionTypeAbsolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float ABI49_0_0YGNode::getLeadingBorder(const ABI49_0_0YGFlexDirection axis) const {
  ABI49_0_0YGValue leadingBorder = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), ABI49_0_0YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), leading[axis], CompactValue::ofZero());
  return fmaxf(leadingBorder.value, 0.0f);
}

float ABI49_0_0YGNode::getTrailingBorder(const ABI49_0_0YGFlexDirection axis) const {
  ABI49_0_0YGValue trailingBorder = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), ABI49_0_0YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), trailing[axis], CompactValue::ofZero());
  return fmaxf(trailingBorder.value, 0.0f);
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getLeadingPadding(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto leadingPadding = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(),
            ABI49_0_0YGEdgeStart,
            leading[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), leading[axis], CompactValue::ofZero());
  return ABI49_0_0YGFloatOptionalMax(
      ABI49_0_0YGResolveValue(leadingPadding, widthSize), ABI49_0_0YGFloatOptional(0.0f));
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getTrailingPadding(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  auto trailingPadding = ABI49_0_0YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(), ABI49_0_0YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), trailing[axis], CompactValue::ofZero());
  return ABI49_0_0YGFloatOptionalMax(
      ABI49_0_0YGResolveValue(trailingPadding, widthSize), ABI49_0_0YGFloatOptional(0.0f));
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getLeadingPaddingAndBorder(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      ABI49_0_0YGFloatOptional(getLeadingBorder(axis));
}

ABI49_0_0YGFloatOptional ABI49_0_0YGNode::getTrailingPaddingAndBorder(
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      ABI49_0_0YGFloatOptional(getTrailingBorder(axis));
}

void ABI49_0_0YGNode::reset() {
  ABI49_0_0YGAssertWithNode(
      this,
      children_.size() == 0,
      "Cannot reset a node which still has children attached");
  ABI49_0_0YGAssertWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  clearChildren();

  auto webDefaults =
      ABI49_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_);
  *this = ABI49_0_0YGNode{getConfig()};
  if (webDefaults) {
    useWebDefaults();
  }
}
