/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI34_0_0YGNode.h"
#include <iostream>
#include "ABI34_0_0CompactValue.h"
#include "ABI34_0_0Utils.h"

using namespace facebook;
using facebook::ABI34_0_0yoga::detail::CompactValue;

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getLeadingPosition(
    const ABI34_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (ABI34_0_0YGFlexDirectionIsRow(axis)) {
    auto leadingPosition = ABI34_0_0YGComputedEdgeValue(
        style_.position, ABI34_0_0YGEdgeStart, CompactValue::ofUndefined());
    if (!leadingPosition.isUndefined()) {
      return ABI34_0_0YGResolveValue(leadingPosition, axisSize);
    }
  }

  auto leadingPosition = ABI34_0_0YGComputedEdgeValue(
      style_.position, leading[axis], CompactValue::ofUndefined());

  return leadingPosition.isUndefined()
      ? ABI34_0_0YGFloatOptional{0}
      : ABI34_0_0YGResolveValue(leadingPosition, axisSize);
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getTrailingPosition(
    const ABI34_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (ABI34_0_0YGFlexDirectionIsRow(axis)) {
    auto trailingPosition = ABI34_0_0YGComputedEdgeValue(
        style_.position, ABI34_0_0YGEdgeEnd, CompactValue::ofUndefined());
    if (!trailingPosition.isUndefined()) {
      return ABI34_0_0YGResolveValue(trailingPosition, axisSize);
    }
  }

  auto trailingPosition = ABI34_0_0YGComputedEdgeValue(
      style_.position, trailing[axis], CompactValue::ofUndefined());

  return trailingPosition.isUndefined()
      ? ABI34_0_0YGFloatOptional{0}
      : ABI34_0_0YGResolveValue(trailingPosition, axisSize);
}

bool ABI34_0_0YGNode::isLeadingPositionDefined(const ABI34_0_0YGFlexDirection axis) const {
  return (ABI34_0_0YGFlexDirectionIsRow(axis) &&
          !ABI34_0_0YGComputedEdgeValue(
               style_.position, ABI34_0_0YGEdgeStart, CompactValue::ofUndefined())
               .isUndefined()) ||
      !ABI34_0_0YGComputedEdgeValue(
           style_.position, leading[axis], CompactValue::ofUndefined())
           .isUndefined();
}

bool ABI34_0_0YGNode::isTrailingPosDefined(const ABI34_0_0YGFlexDirection axis) const {
  return (ABI34_0_0YGFlexDirectionIsRow(axis) &&
          !ABI34_0_0YGComputedEdgeValue(
               style_.position, ABI34_0_0YGEdgeEnd, CompactValue::ofUndefined())
               .isUndefined()) ||
      !ABI34_0_0YGComputedEdgeValue(
           style_.position, trailing[axis], CompactValue::ofUndefined())
           .isUndefined();
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getLeadingMargin(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  if (ABI34_0_0YGFlexDirectionIsRow(axis) && !style_.margin[ABI34_0_0YGEdgeStart].isUndefined()) {
    return ABI34_0_0YGResolveValueMargin(style_.margin[ABI34_0_0YGEdgeStart], widthSize);
  }

  return ABI34_0_0YGResolveValueMargin(
      ABI34_0_0YGComputedEdgeValue(style_.margin, leading[axis], CompactValue::ofZero()),
      widthSize);
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getTrailingMargin(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  if (ABI34_0_0YGFlexDirectionIsRow(axis) && !style_.margin[ABI34_0_0YGEdgeEnd].isUndefined()) {
    return ABI34_0_0YGResolveValueMargin(style_.margin[ABI34_0_0YGEdgeEnd], widthSize);
  }

  return ABI34_0_0YGResolveValueMargin(
      ABI34_0_0YGComputedEdgeValue(
          style_.margin, trailing[axis], CompactValue::ofZero()),
      widthSize);
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getMarginForAxis(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

// Setters

void ABI34_0_0YGNode::setMeasureFunc(ABI34_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    measure_ = nullptr;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    nodeType_ = ABI34_0_0YGNodeTypeDefault;
  } else {
    ABI34_0_0YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    measure_ = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI34_0_0YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void ABI34_0_0YGNode::replaceChild(ABI34_0_0YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void ABI34_0_0YGNode::replaceChild(ABI34_0_0YGNodeRef oldChild, ABI34_0_0YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void ABI34_0_0YGNode::insertChild(ABI34_0_0YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void ABI34_0_0YGNode::setDirty(bool isDirty) {
  if (isDirty == isDirty_) {
    return;
  }
  isDirty_ = isDirty;
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool ABI34_0_0YGNode::removeChild(ABI34_0_0YGNodeRef child) {
  std::vector<ABI34_0_0YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void ABI34_0_0YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void ABI34_0_0YGNode::setLayoutDirection(ABI34_0_0YGDirection direction) {
  layout_.direction = direction;
}

void ABI34_0_0YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void ABI34_0_0YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void ABI34_0_0YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void ABI34_0_0YGNode::setLayoutLastOwnerDirection(ABI34_0_0YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void ABI34_0_0YGNode::setLayoutComputedFlexBasis(
    const ABI34_0_0YGFloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void ABI34_0_0YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void ABI34_0_0YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void ABI34_0_0YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void ABI34_0_0YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.hadOverflow = hadOverflow;
}

void ABI34_0_0YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
ABI34_0_0YGFloatOptional ABI34_0_0YGNode::relativePosition(
    const ABI34_0_0YGFlexDirection axis,
    const float axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  ABI34_0_0YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition = ABI34_0_0YGFloatOptional{-1 * trailingPosition.unwrap()};
  }
  return trailingPosition;
}

void ABI34_0_0YGNode::setPosition(
    const ABI34_0_0YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const ABI34_0_0YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : ABI34_0_0YGDirectionLTR;
  const ABI34_0_0YGFlexDirection mainAxis =
      ABI34_0_0YGResolveFlexDirection(style_.flexDirection, directionRespectingRoot);
  const ABI34_0_0YGFlexDirection crossAxis =
      ABI34_0_0YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  const ABI34_0_0YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const ABI34_0_0YGFloatOptional relativePositionCross =
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

ABI34_0_0YGNode& ABI34_0_0YGNode::operator=(const ABI34_0_0YGNode& node) {
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
  dirtied_ = node.getDirtied();
  style_ = node.style_;
  layout_ = node.layout_;
  lineIndex_ = node.getLineIndex();
  owner_ = node.getOwner();
  children_ = node.getChildren();
  config_ = node.getConfig();
  isDirty_ = node.isDirty();
  resolvedDimensions_ = node.getResolvedDimensions();

  return *this;
}

ABI34_0_0YGValue ABI34_0_0YGNode::marginLeadingValue(const ABI34_0_0YGFlexDirection axis) const {
  if (ABI34_0_0YGFlexDirectionIsRow(axis) && !style_.margin[ABI34_0_0YGEdgeStart].isUndefined()) {
    return style_.margin[ABI34_0_0YGEdgeStart];
  } else {
    return style_.margin[leading[axis]];
  }
}

ABI34_0_0YGValue ABI34_0_0YGNode::marginTrailingValue(const ABI34_0_0YGFlexDirection axis) const {
  if (ABI34_0_0YGFlexDirectionIsRow(axis) && !style_.margin[ABI34_0_0YGEdgeEnd].isUndefined()) {
    return style_.margin[ABI34_0_0YGEdgeEnd];
  } else {
    return style_.margin[trailing[axis]];
  }
}

ABI34_0_0YGValue ABI34_0_0YGNode::resolveFlexBasisPtr() const {
  ABI34_0_0YGValue flexBasis = style_.flexBasis;
  if (flexBasis.unit != ABI34_0_0YGUnitAuto && flexBasis.unit != ABI34_0_0YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex.isUndefined() && style_.flex.unwrap() > 0.0f) {
    return config_->useWebDefaults ? ABI34_0_0YGValueAuto : ABI34_0_0YGValueZero;
  }
  return ABI34_0_0YGValueAuto;
}

void ABI34_0_0YGNode::resolveDimension() {
  using namespace ABI34_0_0yoga;
  for (int dim = ABI34_0_0YGDimensionWidth; dim < enums::count<ABI34_0_0YGDimension>(); dim++) {
    if (!getStyle().maxDimensions[dim].isUndefined() &&
        ABI34_0_0YGValueEqual(
            getStyle().maxDimensions[dim], style_.minDimensions[dim])) {
      resolvedDimensions_[dim] = style_.maxDimensions[dim];
    } else {
      resolvedDimensions_[dim] = style_.dimensions[dim];
    }
  }
}

ABI34_0_0YGDirection ABI34_0_0YGNode::resolveDirection(const ABI34_0_0YGDirection ownerDirection) {
  if (style_.direction == ABI34_0_0YGDirectionInherit) {
    return ownerDirection > ABI34_0_0YGDirectionInherit ? ownerDirection
                                               : ABI34_0_0YGDirectionLTR;
  } else {
    return style_.direction;
  }
}

void ABI34_0_0YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void ABI34_0_0YGNode::cloneChildrenIfNeeded() {
  // ABI34_0_0YGNodeRemoveChild in ABI34_0_0yoga.cpp has a forked variant of this algorithm
  // optimized for deletions.

  const uint32_t childCount = static_cast<uint32_t>(children_.size());
  if (childCount == 0) {
    // This is an empty set. Nothing to clone.
    return;
  }

  const ABI34_0_0YGNodeRef firstChild = children_.front();
  if (firstChild->getOwner() == this) {
    // If the first child has this node as its owner, we assume that it is
    // already unique. We can do this because if we have it has a child, that
    // means that its owner was at some point cloned which made that subtree
    // immutable. We also assume that all its sibling are cloned as well.
    return;
  }

  const ABI34_0_0YGCloneNodeFunc cloneNodeCallback = config_->cloneNodeCallback;
  for (uint32_t i = 0; i < childCount; ++i) {
    const ABI34_0_0YGNodeRef oldChild = children_[i];
    ABI34_0_0YGNodeRef newChild = nullptr;
    if (cloneNodeCallback) {
      newChild = cloneNodeCallback(oldChild, this, i);
    }
    if (newChild == nullptr) {
      newChild = ABI34_0_0YGNodeClone(oldChild);
    }
    replaceChild(newChild, i);
    newChild->setOwner(this);
  }
}

void ABI34_0_0YGNode::markDirtyAndPropogate() {
  if (!isDirty_) {
    setDirty(true);
    setLayoutComputedFlexBasis(ABI34_0_0YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropogate();
    }
  }
}

void ABI34_0_0YGNode::markDirtyAndPropogateDownwards() {
  isDirty_ = true;
  for_each(children_.begin(), children_.end(), [](ABI34_0_0YGNodeRef childNode) {
    childNode->markDirtyAndPropogateDownwards();
  });
}

float ABI34_0_0YGNode::resolveFlexGrow() {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexGrow.isUndefined()) {
    return style_.flexGrow.unwrap();
  }
  if (!style_.flex.isUndefined() && style_.flex.unwrap() > 0.0f) {
    return style_.flex.unwrap();
  }
  return kDefaultFlexGrow;
}

float ABI34_0_0YGNode::resolveFlexShrink() {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink.isUndefined()) {
    return style_.flexShrink.unwrap();
  }
  if (!config_->useWebDefaults && !style_.flex.isUndefined() &&
      style_.flex.unwrap() < 0.0f) {
    return -style_.flex.unwrap();
  }
  return config_->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

bool ABI34_0_0YGNode::isNodeFlexible() {
  return (
      (style_.positionType == ABI34_0_0YGPositionTypeRelative) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float ABI34_0_0YGNode::getLeadingBorder(const ABI34_0_0YGFlexDirection axis) const {
  ABI34_0_0YGValue leadingBorder;
  if (ABI34_0_0YGFlexDirectionIsRow(axis) && !style_.border[ABI34_0_0YGEdgeStart].isUndefined()) {
    leadingBorder = style_.border[ABI34_0_0YGEdgeStart];
    if (leadingBorder.value >= 0) {
      return leadingBorder.value;
    }
  }

  leadingBorder =
      ABI34_0_0YGComputedEdgeValue(style_.border, leading[axis], CompactValue::ofZero());
  return ABI34_0_0YGFloatMax(leadingBorder.value, 0.0f);
}

float ABI34_0_0YGNode::getTrailingBorder(const ABI34_0_0YGFlexDirection flexDirection) const {
  ABI34_0_0YGValue trailingBorder;
  if (ABI34_0_0YGFlexDirectionIsRow(flexDirection) &&
      !style_.border[ABI34_0_0YGEdgeEnd].isUndefined()) {
    trailingBorder = style_.border[ABI34_0_0YGEdgeEnd];
    if (trailingBorder.value >= 0.0f) {
      return trailingBorder.value;
    }
  }

  trailingBorder = ABI34_0_0YGComputedEdgeValue(
      style_.border, trailing[flexDirection], CompactValue::ofZero());
  return ABI34_0_0YGFloatMax(trailingBorder.value, 0.0f);
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getLeadingPadding(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  const ABI34_0_0YGFloatOptional paddingEdgeStart =
      ABI34_0_0YGResolveValue(style_.padding[ABI34_0_0YGEdgeStart], widthSize);
  if (ABI34_0_0YGFlexDirectionIsRow(axis) &&
      !style_.padding[ABI34_0_0YGEdgeStart].isUndefined() &&
      !paddingEdgeStart.isUndefined() && paddingEdgeStart.unwrap() >= 0.0f) {
    return paddingEdgeStart;
  }

  ABI34_0_0YGFloatOptional resolvedValue = ABI34_0_0YGResolveValue(
      ABI34_0_0YGComputedEdgeValue(
          style_.padding, leading[axis], CompactValue::ofZero()),
      widthSize);
  return ABI34_0_0YGFloatOptionalMax(resolvedValue, ABI34_0_0YGFloatOptional(0.0f));
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getTrailingPadding(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  const ABI34_0_0YGFloatOptional paddingEdgeEnd =
      ABI34_0_0YGResolveValue(style_.padding[ABI34_0_0YGEdgeEnd], widthSize);
  if (ABI34_0_0YGFlexDirectionIsRow(axis) && paddingEdgeEnd >= ABI34_0_0YGFloatOptional{0.0f}) {
    return paddingEdgeEnd;
  }

  ABI34_0_0YGFloatOptional resolvedValue = ABI34_0_0YGResolveValue(
      ABI34_0_0YGComputedEdgeValue(
          style_.padding, trailing[axis], CompactValue::ofZero()),
      widthSize);

  return ABI34_0_0YGFloatOptionalMax(resolvedValue, ABI34_0_0YGFloatOptional(0.0f));
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getLeadingPaddingAndBorder(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      ABI34_0_0YGFloatOptional(getLeadingBorder(axis));
}

ABI34_0_0YGFloatOptional ABI34_0_0YGNode::getTrailingPaddingAndBorder(
    const ABI34_0_0YGFlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      ABI34_0_0YGFloatOptional(getTrailingBorder(axis));
}

bool ABI34_0_0YGNode::didUseLegacyFlag() {
  bool didUseLegacyFlag = layout_.didUseLegacyFlag;
  if (didUseLegacyFlag) {
    return true;
  }
  for (const auto& child : children_) {
    if (child->layout_.didUseLegacyFlag) {
      didUseLegacyFlag = true;
      break;
    }
  }
  return didUseLegacyFlag;
}

void ABI34_0_0YGNode::setAndPropogateUseLegacyFlag(bool useLegacyFlag) {
  config_->useLegacyStretchBehaviour = useLegacyFlag;
  for_each(children_.begin(), children_.end(), [=](ABI34_0_0YGNodeRef childNode) {
    childNode->getConfig()->useLegacyStretchBehaviour = useLegacyFlag;
  });
}

void ABI34_0_0YGNode::setLayoutDoesLegacyFlagAffectsLayout(
    bool doesLegacyFlagAffectsLayout) {
  layout_.doesLegacyStretchFlagAffectsLayout = doesLegacyFlagAffectsLayout;
}

void ABI34_0_0YGNode::setLayoutDidUseLegacyFlag(bool didUseLegacyFlag) {
  layout_.didUseLegacyFlag = didUseLegacyFlag;
}

bool ABI34_0_0YGNode::isLayoutTreeEqualToNode(const ABI34_0_0YGNode& node) const {
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
  ABI34_0_0YGNodeRef otherNodeChildren = nullptr;
  for (std::vector<ABI34_0_0YGNodeRef>::size_type i = 0; i < children_.size(); ++i) {
    otherNodeChildren = node.children_[i];
    isLayoutTreeEqual =
        children_[i]->isLayoutTreeEqualToNode(*otherNodeChildren);
    if (!isLayoutTreeEqual) {
      return false;
    }
  }
  return isLayoutTreeEqual;
}
