/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0YGNode.h"
#include <algorithm>
#include <iostream>
#include "ABI43_0_0CompactValue.h"
#include "ABI43_0_0Utils.h"

using namespace ABI43_0_0facebook;
using ABI43_0_0facebook::yoga::detail::CompactValue;

ABI43_0_0YGNode::ABI43_0_0YGNode(ABI43_0_0YGNode&& node) {
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

ABI43_0_0YGNode::ABI43_0_0YGNode(const ABI43_0_0YGNode& node, ABI43_0_0YGConfigRef config) : ABI43_0_0YGNode{node} {
  config_ = config;
  if (config->useWebDefaults) {
    useWebDefaults();
  }
}

void ABI43_0_0YGNode::print(void* printContext) {
  if (print_.noContext != nullptr) {
    if (ABI43_0_0facebook::yoga::detail::getBooleanData(flags, printUsesContext_)) {
      print_.withContext(this, printContext);
    } else {
      print_.noContext(this);
    }
  }
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getLeadingPosition(
    const ABI43_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (ABI43_0_0YGFlexDirectionIsRow(axis)) {
    auto leadingPosition = ABI43_0_0YGComputedEdgeValue(
        style_.position(), ABI43_0_0YGEdgeStart, CompactValue::ofUndefined());
    if (!leadingPosition.isUndefined()) {
      return ABI43_0_0YGResolveValue(leadingPosition, axisSize);
    }
  }

  auto leadingPosition = ABI43_0_0YGComputedEdgeValue(
      style_.position(), leading[axis], CompactValue::ofUndefined());

  return leadingPosition.isUndefined()
      ? ABI43_0_0YGFloatOptional{0}
      : ABI43_0_0YGResolveValue(leadingPosition, axisSize);
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getTrailingPosition(
    const ABI43_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (ABI43_0_0YGFlexDirectionIsRow(axis)) {
    auto trailingPosition = ABI43_0_0YGComputedEdgeValue(
        style_.position(), ABI43_0_0YGEdgeEnd, CompactValue::ofUndefined());
    if (!trailingPosition.isUndefined()) {
      return ABI43_0_0YGResolveValue(trailingPosition, axisSize);
    }
  }

  auto trailingPosition = ABI43_0_0YGComputedEdgeValue(
      style_.position(), trailing[axis], CompactValue::ofUndefined());

  return trailingPosition.isUndefined()
      ? ABI43_0_0YGFloatOptional{0}
      : ABI43_0_0YGResolveValue(trailingPosition, axisSize);
}

bool ABI43_0_0YGNode::isLeadingPositionDefined(const ABI43_0_0YGFlexDirection axis) const {
  return (ABI43_0_0YGFlexDirectionIsRow(axis) &&
          !ABI43_0_0YGComputedEdgeValue(
               style_.position(), ABI43_0_0YGEdgeStart, CompactValue::ofUndefined())
               .isUndefined()) ||
      !ABI43_0_0YGComputedEdgeValue(
           style_.position(), leading[axis], CompactValue::ofUndefined())
           .isUndefined();
}

bool ABI43_0_0YGNode::isTrailingPosDefined(const ABI43_0_0YGFlexDirection axis) const {
  return (ABI43_0_0YGFlexDirectionIsRow(axis) &&
          !ABI43_0_0YGComputedEdgeValue(
               style_.position(), ABI43_0_0YGEdgeEnd, CompactValue::ofUndefined())
               .isUndefined()) ||
      !ABI43_0_0YGComputedEdgeValue(
           style_.position(), trailing[axis], CompactValue::ofUndefined())
           .isUndefined();
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getLeadingMargin(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  if (ABI43_0_0YGFlexDirectionIsRow(axis) &&
      !style_.margin()[ABI43_0_0YGEdgeStart].isUndefined()) {
    return ABI43_0_0YGResolveValueMargin(style_.margin()[ABI43_0_0YGEdgeStart], widthSize);
  }

  return ABI43_0_0YGResolveValueMargin(
      ABI43_0_0YGComputedEdgeValue(
          style_.margin(), leading[axis], CompactValue::ofZero()),
      widthSize);
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getTrailingMargin(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  if (ABI43_0_0YGFlexDirectionIsRow(axis) && !style_.margin()[ABI43_0_0YGEdgeEnd].isUndefined()) {
    return ABI43_0_0YGResolveValueMargin(style_.margin()[ABI43_0_0YGEdgeEnd], widthSize);
  }

  return ABI43_0_0YGResolveValueMargin(
      ABI43_0_0YGComputedEdgeValue(
          style_.margin(), trailing[axis], CompactValue::ofZero()),
      widthSize);
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getMarginForAxis(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

ABI43_0_0YGSize ABI43_0_0YGNode::measure(
    float width,
    ABI43_0_0YGMeasureMode widthMode,
    float height,
    ABI43_0_0YGMeasureMode heightMode,
    void* layoutContext) {

  return ABI43_0_0facebook::yoga::detail::getBooleanData(flags, measureUsesContext_)
      ? measure_.withContext(
            this, width, widthMode, height, heightMode, layoutContext)
      : measure_.noContext(this, width, widthMode, height, heightMode);
}

float ABI43_0_0YGNode::baseline(float width, float height, void* layoutContext) {
  return ABI43_0_0facebook::yoga::detail::getBooleanData(flags, baselineUsesContext_)
      ? baseline_.withContext(this, width, height, layoutContext)
      : baseline_.noContext(this, width, height);
}

// Setters

void ABI43_0_0YGNode::setMeasureFunc(decltype(ABI43_0_0YGNode::measure_) measureFunc) {
  if (measureFunc.noContext == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI43_0_0YGNodeTypeDefault);
  } else {
    ABI43_0_0YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI43_0_0YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void ABI43_0_0YGNode::setMeasureFunc(ABI43_0_0YGMeasureFunc measureFunc) {
  ABI43_0_0facebook::yoga::detail::setBooleanData(flags, measureUsesContext_, false);
  decltype(ABI43_0_0YGNode::measure_) m;
  m.noContext = measureFunc;
  setMeasureFunc(m);
}

YOGA_EXPORT void ABI43_0_0YGNode::setMeasureFunc(MeasureWithContextFn measureFunc) {
  ABI43_0_0facebook::yoga::detail::setBooleanData(flags, measureUsesContext_, true);
  decltype(ABI43_0_0YGNode::measure_) m;
  m.withContext = measureFunc;
  setMeasureFunc(m);
}

void ABI43_0_0YGNode::replaceChild(ABI43_0_0YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void ABI43_0_0YGNode::replaceChild(ABI43_0_0YGNodeRef oldChild, ABI43_0_0YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void ABI43_0_0YGNode::insertChild(ABI43_0_0YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void ABI43_0_0YGNode::setDirty(bool isDirty) {
  if (isDirty == ABI43_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_)) {
    return;
  }
  ABI43_0_0facebook::yoga::detail::setBooleanData(flags, isDirty_, isDirty);
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool ABI43_0_0YGNode::removeChild(ABI43_0_0YGNodeRef child) {
  std::vector<ABI43_0_0YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void ABI43_0_0YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void ABI43_0_0YGNode::setLayoutDirection(ABI43_0_0YGDirection direction) {
  layout_.setDirection(direction);
}

void ABI43_0_0YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void ABI43_0_0YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void ABI43_0_0YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void ABI43_0_0YGNode::setLayoutLastOwnerDirection(ABI43_0_0YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void ABI43_0_0YGNode::setLayoutComputedFlexBasis(
    const ABI43_0_0YGFloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void ABI43_0_0YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void ABI43_0_0YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void ABI43_0_0YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void ABI43_0_0YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void ABI43_0_0YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
ABI43_0_0YGFloatOptional ABI43_0_0YGNode::relativePosition(
    const ABI43_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  ABI43_0_0YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition = ABI43_0_0YGFloatOptional{-1 * trailingPosition.unwrap()};
  }
  return trailingPosition;
}

void ABI43_0_0YGNode::setPosition(
    const ABI43_0_0YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const ABI43_0_0YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : ABI43_0_0YGDirectionLTR;
  const ABI43_0_0YGFlexDirection mainAxis =
      ABI43_0_0YGResolveFlexDirection(style_.flexDirection(), directionRespectingRoot);
  const ABI43_0_0YGFlexDirection crossAxis =
      ABI43_0_0YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  // Here we should check for `ABI43_0_0YGPositionTypeStatic` and in this case zero inset
  // properties (left, right, top, bottom, begin, end).
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const ABI43_0_0YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const ABI43_0_0YGFloatOptional relativePositionCross =
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

ABI43_0_0YGValue ABI43_0_0YGNode::marginLeadingValue(const ABI43_0_0YGFlexDirection axis) const {
  if (ABI43_0_0YGFlexDirectionIsRow(axis) &&
      !style_.margin()[ABI43_0_0YGEdgeStart].isUndefined()) {
    return style_.margin()[ABI43_0_0YGEdgeStart];
  } else {
    return style_.margin()[leading[axis]];
  }
}

ABI43_0_0YGValue ABI43_0_0YGNode::marginTrailingValue(const ABI43_0_0YGFlexDirection axis) const {
  if (ABI43_0_0YGFlexDirectionIsRow(axis) && !style_.margin()[ABI43_0_0YGEdgeEnd].isUndefined()) {
    return style_.margin()[ABI43_0_0YGEdgeEnd];
  } else {
    return style_.margin()[trailing[axis]];
  }
}

ABI43_0_0YGValue ABI43_0_0YGNode::resolveFlexBasisPtr() const {
  ABI43_0_0YGValue flexBasis = style_.flexBasis();
  if (flexBasis.unit != ABI43_0_0YGUnitAuto && flexBasis.unit != ABI43_0_0YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return ABI43_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_)
        ? ABI43_0_0YGValueAuto
        : ABI43_0_0YGValueZero;
  }
  return ABI43_0_0YGValueAuto;
}

void ABI43_0_0YGNode::resolveDimension() {
  using namespace yoga;
  const ABI43_0_0YGStyle& style = getStyle();
  for (auto dim : {ABI43_0_0YGDimensionWidth, ABI43_0_0YGDimensionHeight}) {
    if (!style.maxDimensions()[dim].isUndefined() &&
        ABI43_0_0YGValueEqual(style.maxDimensions()[dim], style.minDimensions()[dim])) {
      resolvedDimensions_[dim] = style.maxDimensions()[dim];
    } else {
      resolvedDimensions_[dim] = style.dimensions()[dim];
    }
  }
}

ABI43_0_0YGDirection ABI43_0_0YGNode::resolveDirection(const ABI43_0_0YGDirection ownerDirection) {
  if (style_.direction() == ABI43_0_0YGDirectionInherit) {
    return ownerDirection > ABI43_0_0YGDirectionInherit ? ownerDirection
                                               : ABI43_0_0YGDirectionLTR;
  } else {
    return style_.direction();
  }
}

YOGA_EXPORT void ABI43_0_0YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void ABI43_0_0YGNode::cloneChildrenIfNeeded(void* cloneContext) {
  iterChildrenAfterCloningIfNeeded([](ABI43_0_0YGNodeRef, void*) {}, cloneContext);
}

void ABI43_0_0YGNode::markDirtyAndPropogate() {
  if (!ABI43_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_)) {
    setDirty(true);
    setLayoutComputedFlexBasis(ABI43_0_0YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropogate();
    }
  }
}

void ABI43_0_0YGNode::markDirtyAndPropogateDownwards() {
  ABI43_0_0facebook::yoga::detail::setBooleanData(flags, isDirty_, true);
  for_each(children_.begin(), children_.end(), [](ABI43_0_0YGNodeRef childNode) {
    childNode->markDirtyAndPropogateDownwards();
  });
}

float ABI43_0_0YGNode::resolveFlexGrow() const {
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

float ABI43_0_0YGNode::resolveFlexShrink() const {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink().isUndefined()) {
    return style_.flexShrink().unwrap();
  }
  if (!ABI43_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_) &&
      !style_.flex().isUndefined() && style_.flex().unwrap() < 0.0f) {
    return -style_.flex().unwrap();
  }
  return ABI43_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_)
      ? kWebDefaultFlexShrink
      : kDefaultFlexShrink;
}

bool ABI43_0_0YGNode::isNodeFlexible() {
  return (
      (style_.positionType() != ABI43_0_0YGPositionTypeAbsolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float ABI43_0_0YGNode::getLeadingBorder(const ABI43_0_0YGFlexDirection axis) const {
  ABI43_0_0YGValue leadingBorder;
  if (ABI43_0_0YGFlexDirectionIsRow(axis) &&
      !style_.border()[ABI43_0_0YGEdgeStart].isUndefined()) {
    leadingBorder = style_.border()[ABI43_0_0YGEdgeStart];
    if (leadingBorder.value >= 0) {
      return leadingBorder.value;
    }
  }

  leadingBorder = ABI43_0_0YGComputedEdgeValue(
      style_.border(), leading[axis], CompactValue::ofZero());
  return ABI43_0_0YGFloatMax(leadingBorder.value, 0.0f);
}

float ABI43_0_0YGNode::getTrailingBorder(const ABI43_0_0YGFlexDirection flexDirection) const {
  ABI43_0_0YGValue trailingBorder;
  if (ABI43_0_0YGFlexDirectionIsRow(flexDirection) &&
      !style_.border()[ABI43_0_0YGEdgeEnd].isUndefined()) {
    trailingBorder = style_.border()[ABI43_0_0YGEdgeEnd];
    if (trailingBorder.value >= 0.0f) {
      return trailingBorder.value;
    }
  }

  trailingBorder = ABI43_0_0YGComputedEdgeValue(
      style_.border(), trailing[flexDirection], CompactValue::ofZero());
  return ABI43_0_0YGFloatMax(trailingBorder.value, 0.0f);
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getLeadingPadding(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  const ABI43_0_0YGFloatOptional paddingEdgeStart =
      ABI43_0_0YGResolveValue(style_.padding()[ABI43_0_0YGEdgeStart], widthSize);
  if (ABI43_0_0YGFlexDirectionIsRow(axis) &&
      !style_.padding()[ABI43_0_0YGEdgeStart].isUndefined() &&
      !paddingEdgeStart.isUndefined() && paddingEdgeStart.unwrap() >= 0.0f) {
    return paddingEdgeStart;
  }

  ABI43_0_0YGFloatOptional resolvedValue = ABI43_0_0YGResolveValue(
      ABI43_0_0YGComputedEdgeValue(
          style_.padding(), leading[axis], CompactValue::ofZero()),
      widthSize);
  return ABI43_0_0YGFloatOptionalMax(resolvedValue, ABI43_0_0YGFloatOptional(0.0f));
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getTrailingPadding(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  const ABI43_0_0YGFloatOptional paddingEdgeEnd =
      ABI43_0_0YGResolveValue(style_.padding()[ABI43_0_0YGEdgeEnd], widthSize);
  if (ABI43_0_0YGFlexDirectionIsRow(axis) && paddingEdgeEnd >= ABI43_0_0YGFloatOptional{0.0f}) {
    return paddingEdgeEnd;
  }

  ABI43_0_0YGFloatOptional resolvedValue = ABI43_0_0YGResolveValue(
      ABI43_0_0YGComputedEdgeValue(
          style_.padding(), trailing[axis], CompactValue::ofZero()),
      widthSize);

  return ABI43_0_0YGFloatOptionalMax(resolvedValue, ABI43_0_0YGFloatOptional(0.0f));
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getLeadingPaddingAndBorder(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      ABI43_0_0YGFloatOptional(getLeadingBorder(axis));
}

ABI43_0_0YGFloatOptional ABI43_0_0YGNode::getTrailingPaddingAndBorder(
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      ABI43_0_0YGFloatOptional(getTrailingBorder(axis));
}

bool ABI43_0_0YGNode::didUseLegacyFlag() {
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

void ABI43_0_0YGNode::setLayoutDoesLegacyFlagAffectsLayout(
    bool doesLegacyFlagAffectsLayout) {
  layout_.setDoesLegacyStretchFlagAffectsLayout(doesLegacyFlagAffectsLayout);
}

void ABI43_0_0YGNode::setLayoutDidUseLegacyFlag(bool didUseLegacyFlag) {
  layout_.setDidUseLegacyFlag(didUseLegacyFlag);
}

bool ABI43_0_0YGNode::isLayoutTreeEqualToNode(const ABI43_0_0YGNode& node) const {
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
  ABI43_0_0YGNodeRef otherNodeChildren = nullptr;
  for (std::vector<ABI43_0_0YGNodeRef>::size_type i = 0; i < children_.size(); ++i) {
    otherNodeChildren = node.children_[i];
    isLayoutTreeEqual =
        children_[i]->isLayoutTreeEqualToNode(*otherNodeChildren);
    if (!isLayoutTreeEqual) {
      return false;
    }
  }
  return isLayoutTreeEqual;
}

void ABI43_0_0YGNode::reset() {
  ABI43_0_0YGAssertWithNode(
      this,
      children_.size() == 0,
      "Cannot reset a node which still has children attached");
  ABI43_0_0YGAssertWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  clearChildren();

  auto webDefaults =
      ABI43_0_0facebook::yoga::detail::getBooleanData(flags, useWebDefaults_);
  *this = ABI43_0_0YGNode{getConfig()};
  if (webDefaults) {
    useWebDefaults();
  }
}
