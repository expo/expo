/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <stdio.h>
#include "ABI34_0_0YGConfig.h"
#include "ABI34_0_0YGLayout.h"
#include "ABI34_0_0YGStyle.h"
#include "ABI34_0_0Yoga-internal.h"

struct ABI34_0_0YGNode {
private:
  void* context_ = nullptr;
  ABI34_0_0YGPrintFunc print_ = nullptr;
  bool hasNewLayout_ : 1;
  bool isReferenceBaseline_ : 1;
  bool isDirty_ : 1;
  ABI34_0_0YGNodeType nodeType_ : 1;
  ABI34_0_0YGMeasureFunc measure_ = nullptr;
  ABI34_0_0YGBaselineFunc baseline_ = nullptr;
  ABI34_0_0YGDirtiedFunc dirtied_ = nullptr;
  ABI34_0_0YGStyle style_ = {};
  ABI34_0_0YGLayout layout_ = {};
  uint32_t lineIndex_ = 0;
  ABI34_0_0YGNodeRef owner_ = nullptr;
  ABI34_0_0YGVector children_ = {};
  ABI34_0_0YGConfigRef config_ = nullptr;
  std::array<ABI34_0_0YGValue, 2> resolvedDimensions_ = {
      {ABI34_0_0YGValueUndefined, ABI34_0_0YGValueUndefined}};

  ABI34_0_0YGFloatOptional relativePosition(
      const ABI34_0_0YGFlexDirection axis,
      const float axisSize) const;

public:
  ABI34_0_0YGNode()
      : hasNewLayout_(true),
        isReferenceBaseline_(false),
        isDirty_(false),
        nodeType_(ABI34_0_0YGNodeTypeDefault) {}
  ~ABI34_0_0YGNode() = default; // cleanup of owner/children relationships in ABI34_0_0YGNodeFree
  explicit ABI34_0_0YGNode(const ABI34_0_0YGConfigRef newConfig) : config_(newConfig){};
  ABI34_0_0YGNode(const ABI34_0_0YGNode& node) = default;
  ABI34_0_0YGNode& operator=(const ABI34_0_0YGNode& node);

  // Getters
  void* getContext() const {
    return context_;
  }

  ABI34_0_0YGPrintFunc getPrintFunc() const {
    return print_;
  }

  bool getHasNewLayout() const {
    return hasNewLayout_;
  }

  ABI34_0_0YGNodeType getNodeType() const {
    return nodeType_;
  }

  ABI34_0_0YGMeasureFunc getMeasure() const {
    return measure_;
  }

  ABI34_0_0YGBaselineFunc getBaseline() const {
    return baseline_;
  }

  ABI34_0_0YGDirtiedFunc getDirtied() const {
    return dirtied_;
  }

  // For Performance reasons passing as reference.
  ABI34_0_0YGStyle& getStyle() {
    return style_;
  }

  const ABI34_0_0YGStyle& getStyle() const {
    return style_;
  }

  // For Performance reasons passing as reference.
  ABI34_0_0YGLayout& getLayout() {
    return layout_;
  }

  const ABI34_0_0YGLayout& getLayout() const {
    return layout_;
  }

  uint32_t getLineIndex() const {
    return lineIndex_;
  }

  bool isReferenceBaseline() {
    return isReferenceBaseline_;
  }

  // returns the ABI34_0_0YGNodeRef that owns this ABI34_0_0YGNode. An owner is used to identify
  // the YogaTree that a ABI34_0_0YGNode belongs to. This method will return the parent
  // of the ABI34_0_0YGNode when a ABI34_0_0YGNode only belongs to one YogaTree or nullptr when
  // the ABI34_0_0YGNode is shared between two or more YogaTrees.
  ABI34_0_0YGNodeRef getOwner() const {
    return owner_;
  }

  // Deprecated, use getOwner() instead.
  ABI34_0_0YGNodeRef getParent() const {
    return getOwner();
  }

  const ABI34_0_0YGVector& getChildren() const {
    return children_;
  }

  ABI34_0_0YGNodeRef getChild(uint32_t index) const {
    return children_.at(index);
  }

  ABI34_0_0YGConfigRef getConfig() const {
    return config_;
  }

  bool isDirty() const {
    return isDirty_;
  }

  std::array<ABI34_0_0YGValue, 2> getResolvedDimensions() const {
    return resolvedDimensions_;
  }

  ABI34_0_0YGValue getResolvedDimension(int index) const {
    return resolvedDimensions_[index];
  }

  // Methods related to positions, margin, padding and border
  ABI34_0_0YGFloatOptional getLeadingPosition(
      const ABI34_0_0YGFlexDirection axis,
      const float axisSize) const;
  bool isLeadingPositionDefined(const ABI34_0_0YGFlexDirection axis) const;
  bool isTrailingPosDefined(const ABI34_0_0YGFlexDirection axis) const;
  ABI34_0_0YGFloatOptional getTrailingPosition(
      const ABI34_0_0YGFlexDirection axis,
      const float axisSize) const;
  ABI34_0_0YGFloatOptional getLeadingMargin(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI34_0_0YGFloatOptional getTrailingMargin(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  float getLeadingBorder(const ABI34_0_0YGFlexDirection flexDirection) const;
  float getTrailingBorder(const ABI34_0_0YGFlexDirection flexDirection) const;
  ABI34_0_0YGFloatOptional getLeadingPadding(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI34_0_0YGFloatOptional getTrailingPadding(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI34_0_0YGFloatOptional getLeadingPaddingAndBorder(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI34_0_0YGFloatOptional getTrailingPaddingAndBorder(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI34_0_0YGFloatOptional getMarginForAxis(
      const ABI34_0_0YGFlexDirection axis,
      const float widthSize) const;
  // Setters

  void setContext(void* context) {
    context_ = context;
  }

  void setPrintFunc(ABI34_0_0YGPrintFunc printFunc) {
    print_ = printFunc;
  }

  void setHasNewLayout(bool hasNewLayout) {
    hasNewLayout_ = hasNewLayout;
  }

  void setNodeType(ABI34_0_0YGNodeType nodeType) {
    nodeType_ = nodeType;
  }

  void setStyleFlexDirection(ABI34_0_0YGFlexDirection direction) {
    style_.flexDirection = direction;
  }

  void setStyleAlignContent(ABI34_0_0YGAlign alignContent) {
    style_.alignContent = alignContent;
  }

  void setMeasureFunc(ABI34_0_0YGMeasureFunc measureFunc);

  void setBaseLineFunc(ABI34_0_0YGBaselineFunc baseLineFunc) {
    baseline_ = baseLineFunc;
  }

  void setDirtiedFunc(ABI34_0_0YGDirtiedFunc dirtiedFunc) {
    dirtied_ = dirtiedFunc;
  }

  void setStyle(const ABI34_0_0YGStyle& style) {
    style_ = style;
  }

  void setLayout(const ABI34_0_0YGLayout& layout) {
    layout_ = layout;
  }

  void setLineIndex(uint32_t lineIndex) {
    lineIndex_ = lineIndex;
  }

  void setIsReferenceBaseline(bool isReferenceBaseline) {
    isReferenceBaseline_ = isReferenceBaseline;
  }

  void setOwner(ABI34_0_0YGNodeRef owner) {
    owner_ = owner;
  }

  void setChildren(const ABI34_0_0YGVector& children) {
    children_ = children;
  }

  // TODO: rvalue override for setChildren

  void setConfig(ABI34_0_0YGConfigRef config) {
    config_ = config;
  }

  void setDirty(bool isDirty);
  void setLayoutLastOwnerDirection(ABI34_0_0YGDirection direction);
  void setLayoutComputedFlexBasis(const ABI34_0_0YGFloatOptional computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, int index);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimension, int index);
  void setLayoutDirection(ABI34_0_0YGDirection direction);
  void setLayoutMargin(float margin, int index);
  void setLayoutBorder(float border, int index);
  void setLayoutPadding(float padding, int index);
  void setLayoutPosition(float position, int index);
  void setPosition(
      const ABI34_0_0YGDirection direction,
      const float mainSize,
      const float crossSize,
      const float ownerWidth);
  void setAndPropogateUseLegacyFlag(bool useLegacyFlag);
  void setLayoutDoesLegacyFlagAffectsLayout(bool doesLegacyFlagAffectsLayout);
  void setLayoutDidUseLegacyFlag(bool didUseLegacyFlag);
  void markDirtyAndPropogateDownwards();

  // Other methods
  ABI34_0_0YGValue marginLeadingValue(const ABI34_0_0YGFlexDirection axis) const;
  ABI34_0_0YGValue marginTrailingValue(const ABI34_0_0YGFlexDirection axis) const;
  ABI34_0_0YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  ABI34_0_0YGDirection resolveDirection(const ABI34_0_0YGDirection ownerDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(ABI34_0_0YGNodeRef oldChild, ABI34_0_0YGNodeRef newChild);
  void replaceChild(ABI34_0_0YGNodeRef child, uint32_t index);
  void insertChild(ABI34_0_0YGNodeRef child, uint32_t index);
  /// Removes the first occurrence of child
  bool removeChild(ABI34_0_0YGNodeRef child);
  void removeChild(uint32_t index);

  void cloneChildrenIfNeeded();
  void markDirtyAndPropogate();
  float resolveFlexGrow();
  float resolveFlexShrink();
  bool isNodeFlexible();
  bool didUseLegacyFlag();
  bool isLayoutTreeEqualToNode(const ABI34_0_0YGNode& node) const;
};
