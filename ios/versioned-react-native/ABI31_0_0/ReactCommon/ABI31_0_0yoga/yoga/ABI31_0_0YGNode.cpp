/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI31_0_0YGNode.h"
#include <iostream>
#include "ABI31_0_0Utils.h"

using namespace facebook;

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getLeadingPosition(
    const ABI31_0_0YGFlexDirection& axis,
    const float& axisSize) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis)) {
    const ABI31_0_0YGValue* leadingPosition =
        ABI31_0_0YGComputedEdgeValue(style_.position, ABI31_0_0YGEdgeStart, &ABI31_0_0YGValueUndefined);
    if (leadingPosition->unit != ABI31_0_0YGUnitUndefined) {
      return ABI31_0_0YGResolveValue(*leadingPosition, axisSize);
    }
  }

  const ABI31_0_0YGValue* leadingPosition =
      ABI31_0_0YGComputedEdgeValue(style_.position, leading[axis], &ABI31_0_0YGValueUndefined);

  return leadingPosition->unit == ABI31_0_0YGUnitUndefined
      ? ABI31_0_0YGFloatOptional(0)
      : ABI31_0_0YGResolveValue(*leadingPosition, axisSize);
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getTrailingPosition(
    const ABI31_0_0YGFlexDirection& axis,
    const float& axisSize) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis)) {
    const ABI31_0_0YGValue* trailingPosition =
        ABI31_0_0YGComputedEdgeValue(style_.position, ABI31_0_0YGEdgeEnd, &ABI31_0_0YGValueUndefined);
    if (trailingPosition->unit != ABI31_0_0YGUnitUndefined) {
      return ABI31_0_0YGResolveValue(*trailingPosition, axisSize);
    }
  }

  const ABI31_0_0YGValue* trailingPosition =
      ABI31_0_0YGComputedEdgeValue(style_.position, trailing[axis], &ABI31_0_0YGValueUndefined);

  return trailingPosition->unit == ABI31_0_0YGUnitUndefined
      ? ABI31_0_0YGFloatOptional(0)
      : ABI31_0_0YGResolveValue(*trailingPosition, axisSize);
}

bool ABI31_0_0YGNode::isLeadingPositionDefined(const ABI31_0_0YGFlexDirection& axis) const {
  return (ABI31_0_0YGFlexDirectionIsRow(axis) &&
          ABI31_0_0YGComputedEdgeValue(style_.position, ABI31_0_0YGEdgeStart, &ABI31_0_0YGValueUndefined)
                  ->unit != ABI31_0_0YGUnitUndefined) ||
      ABI31_0_0YGComputedEdgeValue(style_.position, leading[axis], &ABI31_0_0YGValueUndefined)
          ->unit != ABI31_0_0YGUnitUndefined;
}

bool ABI31_0_0YGNode::isTrailingPosDefined(const ABI31_0_0YGFlexDirection& axis) const {
  return (ABI31_0_0YGFlexDirectionIsRow(axis) &&
          ABI31_0_0YGComputedEdgeValue(style_.position, ABI31_0_0YGEdgeEnd, &ABI31_0_0YGValueUndefined)
                  ->unit != ABI31_0_0YGUnitUndefined) ||
      ABI31_0_0YGComputedEdgeValue(style_.position, trailing[axis], &ABI31_0_0YGValueUndefined)
          ->unit != ABI31_0_0YGUnitUndefined;
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getLeadingMargin(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.margin[ABI31_0_0YGEdgeStart].unit != ABI31_0_0YGUnitUndefined) {
    return ABI31_0_0YGResolveValueMargin(style_.margin[ABI31_0_0YGEdgeStart], widthSize);
  }

  return ABI31_0_0YGResolveValueMargin(
      *ABI31_0_0YGComputedEdgeValue(style_.margin, leading[axis], &ABI31_0_0YGValueZero),
      widthSize);
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getTrailingMargin(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.margin[ABI31_0_0YGEdgeEnd].unit != ABI31_0_0YGUnitUndefined) {
    return ABI31_0_0YGResolveValueMargin(style_.margin[ABI31_0_0YGEdgeEnd], widthSize);
  }

  return ABI31_0_0YGResolveValueMargin(
      *ABI31_0_0YGComputedEdgeValue(style_.margin, trailing[axis], &ABI31_0_0YGValueZero),
      widthSize);
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getMarginForAxis(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

// Setters

void ABI31_0_0YGNode::setMeasureFunc(ABI31_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    measure_ = nullptr;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    nodeType_ = ABI31_0_0YGNodeTypeDefault;
  } else {
    ABI31_0_0YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.");
    measure_ = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(ABI31_0_0YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void ABI31_0_0YGNode::replaceChild(ABI31_0_0YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void ABI31_0_0YGNode::replaceChild(ABI31_0_0YGNodeRef oldChild, ABI31_0_0YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void ABI31_0_0YGNode::insertChild(ABI31_0_0YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void ABI31_0_0YGNode::setDirty(bool isDirty) {
  if (isDirty == isDirty_) {
    return;
  }
  isDirty_ = isDirty;
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool ABI31_0_0YGNode::removeChild(ABI31_0_0YGNodeRef child) {
  std::vector<ABI31_0_0YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void ABI31_0_0YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void ABI31_0_0YGNode::setLayoutDirection(ABI31_0_0YGDirection direction) {
  layout_.direction = direction;
}

void ABI31_0_0YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void ABI31_0_0YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void ABI31_0_0YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void ABI31_0_0YGNode::setLayoutLastOwnerDirection(ABI31_0_0YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void ABI31_0_0YGNode::setLayoutComputedFlexBasis(
    const ABI31_0_0YGFloatOptional& computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void ABI31_0_0YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void ABI31_0_0YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void ABI31_0_0YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void ABI31_0_0YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.hadOverflow = hadOverflow;
}

void ABI31_0_0YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
ABI31_0_0YGFloatOptional ABI31_0_0YGNode::relativePosition(
    const ABI31_0_0YGFlexDirection& axis,
    const float& axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  ABI31_0_0YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition.setValue(-1 * trailingPosition.getValue());
  }
  return trailingPosition;
}

void ABI31_0_0YGNode::setPosition(
    const ABI31_0_0YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const ABI31_0_0YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : ABI31_0_0YGDirectionLTR;
  const ABI31_0_0YGFlexDirection mainAxis =
      ABI31_0_0YGResolveFlexDirection(style_.flexDirection, directionRespectingRoot);
  const ABI31_0_0YGFlexDirection crossAxis =
      ABI31_0_0YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  const ABI31_0_0YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const ABI31_0_0YGFloatOptional relativePositionCross =
      relativePosition(crossAxis, crossSize);

  setLayoutPosition(
      ABI31_0_0YGUnwrapFloatOptional(
          getLeadingMargin(mainAxis, ownerWidth) + relativePositionMain),
      leading[mainAxis]);
  setLayoutPosition(
      ABI31_0_0YGUnwrapFloatOptional(
          getTrailingMargin(mainAxis, ownerWidth) + relativePositionMain),
      trailing[mainAxis]);
  setLayoutPosition(
      ABI31_0_0YGUnwrapFloatOptional(
          getLeadingMargin(crossAxis, ownerWidth) + relativePositionCross),
      leading[crossAxis]);
  setLayoutPosition(
      ABI31_0_0YGUnwrapFloatOptional(
          getTrailingMargin(crossAxis, ownerWidth) + relativePositionCross),
      trailing[crossAxis]);
}

ABI31_0_0YGNode& ABI31_0_0YGNode::operator=(const ABI31_0_0YGNode& node) {
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

ABI31_0_0YGValue ABI31_0_0YGNode::marginLeadingValue(const ABI31_0_0YGFlexDirection axis) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.margin[ABI31_0_0YGEdgeStart].unit != ABI31_0_0YGUnitUndefined) {
    return style_.margin[ABI31_0_0YGEdgeStart];
  } else {
    return style_.margin[leading[axis]];
  }
}

ABI31_0_0YGValue ABI31_0_0YGNode::marginTrailingValue(const ABI31_0_0YGFlexDirection axis) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.margin[ABI31_0_0YGEdgeEnd].unit != ABI31_0_0YGUnitUndefined) {
    return style_.margin[ABI31_0_0YGEdgeEnd];
  } else {
    return style_.margin[trailing[axis]];
  }
}

ABI31_0_0YGValue ABI31_0_0YGNode::resolveFlexBasisPtr() const {
  ABI31_0_0YGValue flexBasis = style_.flexBasis;
  if (flexBasis.unit != ABI31_0_0YGUnitAuto && flexBasis.unit != ABI31_0_0YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex.isUndefined() && style_.flex.getValue() > 0.0f) {
    return config_->useWebDefaults ? ABI31_0_0YGValueAuto : ABI31_0_0YGValueZero;
  }
  return ABI31_0_0YGValueAuto;
}

void ABI31_0_0YGNode::resolveDimension() {
  for (uint32_t dim = ABI31_0_0YGDimensionWidth; dim < ABI31_0_0YGDimensionCount; dim++) {
    if (getStyle().maxDimensions[dim].unit != ABI31_0_0YGUnitUndefined &&
        ABI31_0_0YGValueEqual(
            getStyle().maxDimensions[dim], style_.minDimensions[dim])) {
      resolvedDimensions_[dim] = style_.maxDimensions[dim];
    } else {
      resolvedDimensions_[dim] = style_.dimensions[dim];
    }
  }
}

ABI31_0_0YGDirection ABI31_0_0YGNode::resolveDirection(const ABI31_0_0YGDirection ownerDirection) {
  if (style_.direction == ABI31_0_0YGDirectionInherit) {
    return ownerDirection > ABI31_0_0YGDirectionInherit ? ownerDirection
                                               : ABI31_0_0YGDirectionLTR;
  } else {
    return style_.direction;
  }
}

void ABI31_0_0YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void ABI31_0_0YGNode::cloneChildrenIfNeeded() {
  // ABI31_0_0YGNodeRemoveChild in yoga.cpp has a forked variant of this algorithm
  // optimized for deletions.

  const uint32_t childCount = static_cast<uint32_t>(children_.size());
  if (childCount == 0) {
    // This is an empty set. Nothing to clone.
    return;
  }

  const ABI31_0_0YGNodeRef firstChild = children_.front();
  if (firstChild->getOwner() == this) {
    // If the first child has this node as its owner, we assume that it is
    // already unique. We can do this because if we have it has a child, that
    // means that its owner was at some point cloned which made that subtree
    // immutable. We also assume that all its sibling are cloned as well.
    return;
  }

  const ABI31_0_0YGCloneNodeFunc cloneNodeCallback = config_->cloneNodeCallback;
  for (uint32_t i = 0; i < childCount; ++i) {
    const ABI31_0_0YGNodeRef oldChild = children_[i];
    ABI31_0_0YGNodeRef newChild = nullptr;
    if (cloneNodeCallback) {
      newChild = cloneNodeCallback(oldChild, this, i);
    }
    if (newChild == nullptr) {
      newChild = ABI31_0_0YGNodeClone(oldChild);
    }
    replaceChild(newChild, i);
    newChild->setOwner(this);
  }
}

void ABI31_0_0YGNode::markDirtyAndPropogate() {
  if (!isDirty_) {
    setDirty(true);
    setLayoutComputedFlexBasis(ABI31_0_0YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropogate();
    }
  }
}

void ABI31_0_0YGNode::markDirtyAndPropogateDownwards() {
  isDirty_ = true;
  for_each(children_.begin(), children_.end(), [](ABI31_0_0YGNodeRef childNode) {
    childNode->markDirtyAndPropogateDownwards();
  });
}

float ABI31_0_0YGNode::resolveFlexGrow() {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexGrow.isUndefined()) {
    return style_.flexGrow.getValue();
  }
  if (!style_.flex.isUndefined() && style_.flex.getValue() > 0.0f) {
    return style_.flex.getValue();
  }
  return kDefaultFlexGrow;
}

float ABI31_0_0YGNode::resolveFlexShrink() {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink.isUndefined()) {
    return style_.flexShrink.getValue();
  }
  if (!config_->useWebDefaults && !style_.flex.isUndefined() &&
      style_.flex.getValue() < 0.0f) {
    return -style_.flex.getValue();
  }
  return config_->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

bool ABI31_0_0YGNode::isNodeFlexible() {
  return (
      (style_.positionType == ABI31_0_0YGPositionTypeRelative) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float ABI31_0_0YGNode::getLeadingBorder(const ABI31_0_0YGFlexDirection& axis) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.border[ABI31_0_0YGEdgeStart].unit != ABI31_0_0YGUnitUndefined &&
      !yoga::isUndefined(style_.border[ABI31_0_0YGEdgeStart].value) &&
      style_.border[ABI31_0_0YGEdgeStart].value >= 0.0f) {
    return style_.border[ABI31_0_0YGEdgeStart].value;
  }

  float computedEdgeValue =
      ABI31_0_0YGComputedEdgeValue(style_.border, leading[axis], &ABI31_0_0YGValueZero)->value;
  return ABI31_0_0YGFloatMax(computedEdgeValue, 0.0f);
}

float ABI31_0_0YGNode::getTrailingBorder(const ABI31_0_0YGFlexDirection& flexDirection) const {
  if (ABI31_0_0YGFlexDirectionIsRow(flexDirection) &&
      style_.border[ABI31_0_0YGEdgeEnd].unit != ABI31_0_0YGUnitUndefined &&
      !yoga::isUndefined(style_.border[ABI31_0_0YGEdgeEnd].value) &&
      style_.border[ABI31_0_0YGEdgeEnd].value >= 0.0f) {
    return style_.border[ABI31_0_0YGEdgeEnd].value;
  }

  float computedEdgeValue =
      ABI31_0_0YGComputedEdgeValue(style_.border, trailing[flexDirection], &ABI31_0_0YGValueZero)
          ->value;
  return ABI31_0_0YGFloatMax(computedEdgeValue, 0.0f);
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getLeadingPadding(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  const ABI31_0_0YGFloatOptional& paddingEdgeStart =
      ABI31_0_0YGResolveValue(style_.padding[ABI31_0_0YGEdgeStart], widthSize);
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.padding[ABI31_0_0YGEdgeStart].unit != ABI31_0_0YGUnitUndefined &&
      !paddingEdgeStart.isUndefined() && paddingEdgeStart.getValue() > 0.0f) {
    return paddingEdgeStart;
  }

  ABI31_0_0YGFloatOptional resolvedValue = ABI31_0_0YGResolveValue(
      *ABI31_0_0YGComputedEdgeValue(style_.padding, leading[axis], &ABI31_0_0YGValueZero),
      widthSize);
  return ABI31_0_0YGFloatOptionalMax(resolvedValue, ABI31_0_0YGFloatOptional(0.0f));
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getTrailingPadding(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  if (ABI31_0_0YGFlexDirectionIsRow(axis) &&
      style_.padding[ABI31_0_0YGEdgeEnd].unit != ABI31_0_0YGUnitUndefined &&
      !ABI31_0_0YGResolveValue(style_.padding[ABI31_0_0YGEdgeEnd], widthSize).isUndefined() &&
      ABI31_0_0YGResolveValue(style_.padding[ABI31_0_0YGEdgeEnd], widthSize).getValue() >= 0.0f) {
    return ABI31_0_0YGResolveValue(style_.padding[ABI31_0_0YGEdgeEnd], widthSize);
  }

  ABI31_0_0YGFloatOptional resolvedValue = ABI31_0_0YGResolveValue(
      *ABI31_0_0YGComputedEdgeValue(style_.padding, trailing[axis], &ABI31_0_0YGValueZero),
      widthSize);

  return ABI31_0_0YGFloatOptionalMax(resolvedValue, ABI31_0_0YGFloatOptional(0.0f));
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getLeadingPaddingAndBorder(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      ABI31_0_0YGFloatOptional(getLeadingBorder(axis));
}

ABI31_0_0YGFloatOptional ABI31_0_0YGNode::getTrailingPaddingAndBorder(
    const ABI31_0_0YGFlexDirection& axis,
    const float& widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      ABI31_0_0YGFloatOptional(getTrailingBorder(axis));
}

bool ABI31_0_0YGNode::didUseLegacyFlag() {
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

void ABI31_0_0YGNode::setAndPropogateUseLegacyFlag(bool useLegacyFlag) {
  config_->useLegacyStretchBehaviour = useLegacyFlag;
  for_each(children_.begin(), children_.end(), [=](ABI31_0_0YGNodeRef childNode) {
    childNode->getConfig()->useLegacyStretchBehaviour = useLegacyFlag;
  });
}

void ABI31_0_0YGNode::setLayoutDoesLegacyFlagAffectsLayout(
    bool doesLegacyFlagAffectsLayout) {
  layout_.doesLegacyStretchFlagAffectsLayout = doesLegacyFlagAffectsLayout;
}

void ABI31_0_0YGNode::setLayoutDidUseLegacyFlag(bool didUseLegacyFlag) {
  layout_.didUseLegacyFlag = didUseLegacyFlag;
}

bool ABI31_0_0YGNode::isLayoutTreeEqualToNode(const ABI31_0_0YGNode& node) const {
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
  ABI31_0_0YGNodeRef otherNodeChildren = nullptr;
  for (std::vector<ABI31_0_0YGNodeRef>::size_type i = 0; i < children_.size(); ++i) {
    otherNodeChildren = node.children_[i];
    isLayoutTreeEqual =
        children_[i]->isLayoutTreeEqualToNode(*otherNodeChildren);
    if (!isLayoutTreeEqual) {
      return false;
    }
  }
  return isLayoutTreeEqual;
}
