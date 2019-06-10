/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <stdio.h>
#include "ABI33_0_0YGConfig.h"
#include "ABI33_0_0YGLayout.h"
#include "ABI33_0_0YGStyle.h"
#include "ABI33_0_0Yoga-internal.h"

struct ABI33_0_0YGNode {
private:
  void* context_ = nullptr;
  ABI33_0_0YGPrintFunc print_ = nullptr;
  bool hasNewLayout_ : 1;
  bool isReferenceBaseline_ : 1;
  bool isDirty_ : 1;
  ABI33_0_0YGNodeType nodeType_ : 1;
  ABI33_0_0YGMeasureFunc measure_ = nullptr;
  ABI33_0_0YGBaselineFunc baseline_ = nullptr;
  ABI33_0_0YGDirtiedFunc dirtied_ = nullptr;
  ABI33_0_0YGStyle style_ = {};
  ABI33_0_0YGLayout layout_ = {};
  uint32_t lineIndex_ = 0;
  ABI33_0_0YGNodeRef owner_ = nullptr;
  ABI33_0_0YGVector children_ = {};
  ABI33_0_0YGConfigRef config_ = nullptr;
  std::array<ABI33_0_0YGValue, 2> resolvedDimensions_ = {
      {ABI33_0_0YGValueUndefined, ABI33_0_0YGValueUndefined}};

  ABI33_0_0YGFloatOptional relativePosition(
      const ABI33_0_0YGFlexDirection axis,
      const float axisSize) const;

public:
  ABI33_0_0YGNode()
      : hasNewLayout_(true),
        isReferenceBaseline_(false),
        isDirty_(false),
        nodeType_(ABI33_0_0YGNodeTypeDefault) {}
  ~ABI33_0_0YGNode() = default; // cleanup of owner/children relationships in ABI33_0_0YGNodeFree
  explicit ABI33_0_0YGNode(const ABI33_0_0YGConfigRef newConfig) : config_(newConfig){};
  ABI33_0_0YGNode(const ABI33_0_0YGNode& node) = default;
  ABI33_0_0YGNode& operator=(const ABI33_0_0YGNode& node);

  // Getters
  void* getContext() const {
    return context_;
  }

  ABI33_0_0YGPrintFunc getPrintFunc() const {
    return print_;
  }

  bool getHasNewLayout() const {
    return hasNewLayout_;
  }

  ABI33_0_0YGNodeType getNodeType() const {
    return nodeType_;
  }

  ABI33_0_0YGMeasureFunc getMeasure() const {
    return measure_;
  }

  ABI33_0_0YGBaselineFunc getBaseline() const {
    return baseline_;
  }

  ABI33_0_0YGDirtiedFunc getDirtied() const {
    return dirtied_;
  }

  // For Performance reasons passing as reference.
  ABI33_0_0YGStyle& getStyle() {
    return style_;
  }

  const ABI33_0_0YGStyle& getStyle() const {
    return style_;
  }

  // For Performance reasons passing as reference.
  ABI33_0_0YGLayout& getLayout() {
    return layout_;
  }

  const ABI33_0_0YGLayout& getLayout() const {
    return layout_;
  }

  uint32_t getLineIndex() const {
    return lineIndex_;
  }

  bool isReferenceBaseline() {
    return isReferenceBaseline_;
  }

  // returns the ABI33_0_0YGNodeRef that owns this ABI33_0_0YGNode. An owner is used to identify
  // the YogaTree that a ABI33_0_0YGNode belongs to. This method will return the parent
  // of the ABI33_0_0YGNode when a ABI33_0_0YGNode only belongs to one YogaTree or nullptr when
  // the ABI33_0_0YGNode is shared between two or more YogaTrees.
  ABI33_0_0YGNodeRef getOwner() const {
    return owner_;
  }

  // Deprecated, use getOwner() instead.
  ABI33_0_0YGNodeRef getParent() const {
    return getOwner();
  }

  const ABI33_0_0YGVector& getChildren() const {
    return children_;
  }

  ABI33_0_0YGNodeRef getChild(uint32_t index) const {
    return children_.at(index);
  }

  ABI33_0_0YGConfigRef getConfig() const {
    return config_;
  }

  bool isDirty() const {
    return isDirty_;
  }

  std::array<ABI33_0_0YGValue, 2> getResolvedDimensions() const {
    return resolvedDimensions_;
  }

  ABI33_0_0YGValue getResolvedDimension(int index) const {
    return resolvedDimensions_[index];
  }

  // Methods related to positions, margin, padding and border
  ABI33_0_0YGFloatOptional getLeadingPosition(
      const ABI33_0_0YGFlexDirection axis,
      const float axisSize) const;
  bool isLeadingPositionDefined(const ABI33_0_0YGFlexDirection axis) const;
  bool isTrailingPosDefined(const ABI33_0_0YGFlexDirection axis) const;
  ABI33_0_0YGFloatOptional getTrailingPosition(
      const ABI33_0_0YGFlexDirection axis,
      const float axisSize) const;
  ABI33_0_0YGFloatOptional getLeadingMargin(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI33_0_0YGFloatOptional getTrailingMargin(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  float getLeadingBorder(const ABI33_0_0YGFlexDirection flexDirection) const;
  float getTrailingBorder(const ABI33_0_0YGFlexDirection flexDirection) const;
  ABI33_0_0YGFloatOptional getLeadingPadding(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI33_0_0YGFloatOptional getTrailingPadding(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI33_0_0YGFloatOptional getLeadingPaddingAndBorder(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI33_0_0YGFloatOptional getTrailingPaddingAndBorder(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI33_0_0YGFloatOptional getMarginForAxis(
      const ABI33_0_0YGFlexDirection axis,
      const float widthSize) const;
  // Setters

  void setContext(void* context) {
    context_ = context;
  }

  void setPrintFunc(ABI33_0_0YGPrintFunc printFunc) {
    print_ = printFunc;
  }

  void setHasNewLayout(bool hasNewLayout) {
    hasNewLayout_ = hasNewLayout;
  }

  void setNodeType(ABI33_0_0YGNodeType nodeType) {
    nodeType_ = nodeType;
  }

  void setStyleFlexDirection(ABI33_0_0YGFlexDirection direction) {
    style_.flexDirection = direction;
  }

  void setStyleAlignContent(ABI33_0_0YGAlign alignContent) {
    style_.alignContent = alignContent;
  }

  void setMeasureFunc(ABI33_0_0YGMeasureFunc measureFunc);

  void setBaseLineFunc(ABI33_0_0YGBaselineFunc baseLineFunc) {
    baseline_ = baseLineFunc;
  }

  void setDirtiedFunc(ABI33_0_0YGDirtiedFunc dirtiedFunc) {
    dirtied_ = dirtiedFunc;
  }

  void setStyle(const ABI33_0_0YGStyle& style) {
    style_ = style;
  }

  void setLayout(const ABI33_0_0YGLayout& layout) {
    layout_ = layout;
  }

  void setLineIndex(uint32_t lineIndex) {
    lineIndex_ = lineIndex;
  }

  void setIsReferenceBaseline(bool isReferenceBaseline) {
    isReferenceBaseline_ = isReferenceBaseline;
  }

  void setOwner(ABI33_0_0YGNodeRef owner) {
    owner_ = owner;
  }

  void setChildren(const ABI33_0_0YGVector& children) {
    children_ = children;
  }

  // TODO: rvalue override for setChildren

  void setConfig(ABI33_0_0YGConfigRef config) {
    config_ = config;
  }

  void setDirty(bool isDirty);
  void setLayoutLastOwnerDirection(ABI33_0_0YGDirection direction);
  void setLayoutComputedFlexBasis(const ABI33_0_0YGFloatOptional computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, int index);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimension, int index);
  void setLayoutDirection(ABI33_0_0YGDirection direction);
  void setLayoutMargin(float margin, int index);
  void setLayoutBorder(float border, int index);
  void setLayoutPadding(float padding, int index);
  void setLayoutPosition(float position, int index);
  void setPosition(
      const ABI33_0_0YGDirection direction,
      const float mainSize,
      const float crossSize,
      const float ownerWidth);
  void setAndPropogateUseLegacyFlag(bool useLegacyFlag);
  void setLayoutDoesLegacyFlagAffectsLayout(bool doesLegacyFlagAffectsLayout);
  void setLayoutDidUseLegacyFlag(bool didUseLegacyFlag);
  void markDirtyAndPropogateDownwards();

  // Other methods
  ABI33_0_0YGValue marginLeadingValue(const ABI33_0_0YGFlexDirection axis) const;
  ABI33_0_0YGValue marginTrailingValue(const ABI33_0_0YGFlexDirection axis) const;
  ABI33_0_0YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  ABI33_0_0YGDirection resolveDirection(const ABI33_0_0YGDirection ownerDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(ABI33_0_0YGNodeRef oldChild, ABI33_0_0YGNodeRef newChild);
  void replaceChild(ABI33_0_0YGNodeRef child, uint32_t index);
  void insertChild(ABI33_0_0YGNodeRef child, uint32_t index);
  /// Removes the first occurrence of child
  bool removeChild(ABI33_0_0YGNodeRef child);
  void removeChild(uint32_t index);

  void cloneChildrenIfNeeded();
  void markDirtyAndPropogate();
  float resolveFlexGrow();
  float resolveFlexShrink();
  bool isNodeFlexible();
  bool didUseLegacyFlag();
  bool isLayoutTreeEqualToNode(const ABI33_0_0YGNode& node) const;
};
