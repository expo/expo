/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <stdio.h>
#include "ABI29_0_0YGLayout.h"
#include "ABI29_0_0YGStyle.h"
#include "ABI29_0_0Yoga-internal.h"

struct ABI29_0_0YGNode {
 private:
  void* context_;
  ABI29_0_0YGPrintFunc print_;
  bool hasNewLayout_;
  ABI29_0_0YGNodeType nodeType_;
  ABI29_0_0YGMeasureFunc measure_;
  ABI29_0_0YGBaselineFunc baseline_;
  ABI29_0_0YGDirtiedFunc dirtied_;
  ABI29_0_0YGStyle style_;
  ABI29_0_0YGLayout layout_;
  uint32_t lineIndex_;
  ABI29_0_0YGNodeRef parent_;
  ABI29_0_0YGVector children_;
  ABI29_0_0YGNodeRef nextChild_;
  ABI29_0_0YGConfigRef config_;
  bool isDirty_;
  std::array<ABI29_0_0YGValue, 2> resolvedDimensions_;

  float relativePosition(const ABI29_0_0YGFlexDirection axis, const float axisSize);

 public:
  ABI29_0_0YGNode();
  ~ABI29_0_0YGNode();
  explicit ABI29_0_0YGNode(const ABI29_0_0YGConfigRef newConfig);
  ABI29_0_0YGNode(const ABI29_0_0YGNode& node);
  ABI29_0_0YGNode& operator=(const ABI29_0_0YGNode& node);
  ABI29_0_0YGNode(
      void* context,
      ABI29_0_0YGPrintFunc print,
      bool hasNewLayout,
      ABI29_0_0YGNodeType nodeType,
      ABI29_0_0YGMeasureFunc measure,
      ABI29_0_0YGBaselineFunc baseline,
      ABI29_0_0YGDirtiedFunc dirtied,
      ABI29_0_0YGStyle style,
      ABI29_0_0YGLayout layout,
      uint32_t lineIndex,
      ABI29_0_0YGNodeRef parent,
      ABI29_0_0YGVector children,
      ABI29_0_0YGNodeRef nextChild,
      ABI29_0_0YGConfigRef config,
      bool isDirty,
      std::array<ABI29_0_0YGValue, 2> resolvedDimensions);

  // Getters
  void* getContext() const;
  ABI29_0_0YGPrintFunc getPrintFunc() const;
  bool getHasNewLayout() const;
  ABI29_0_0YGNodeType getNodeType() const;
  ABI29_0_0YGMeasureFunc getMeasure() const;
  ABI29_0_0YGBaselineFunc getBaseline() const;
  ABI29_0_0YGDirtiedFunc getDirtied() const;
  // For Performance reasons passing as reference.
  ABI29_0_0YGStyle& getStyle();
  // For Performance reasons passing as reference.
  ABI29_0_0YGLayout& getLayout();
  uint32_t getLineIndex() const;
  ABI29_0_0YGNodeRef getParent() const;
  ABI29_0_0YGVector getChildren() const;
  uint32_t getChildrenCount() const;
  ABI29_0_0YGNodeRef getChild(uint32_t index) const;
  ABI29_0_0YGNodeRef getNextChild() const;
  ABI29_0_0YGConfigRef getConfig() const;
  bool isDirty() const;
  std::array<ABI29_0_0YGValue, 2> getResolvedDimensions() const;
  ABI29_0_0YGValue getResolvedDimension(int index);

  // Methods related to positions, margin, padding and border
  float getLeadingPosition(const ABI29_0_0YGFlexDirection axis, const float axisSize);
  bool isLeadingPositionDefined(const ABI29_0_0YGFlexDirection axis);
  bool isTrailingPosDefined(const ABI29_0_0YGFlexDirection axis);
  float getTrailingPosition(const ABI29_0_0YGFlexDirection axis, const float axisSize);
  float getLeadingMargin(const ABI29_0_0YGFlexDirection axis, const float widthSize);
  float getTrailingMargin(const ABI29_0_0YGFlexDirection axis, const float widthSize);
  float getLeadingBorder(const ABI29_0_0YGFlexDirection flexDirection);
  float getTrailingBorder(const ABI29_0_0YGFlexDirection flexDirection);
  float getLeadingPadding(const ABI29_0_0YGFlexDirection axis, const float widthSize);
  float getTrailingPadding(const ABI29_0_0YGFlexDirection axis, const float widthSize);
  float getLeadingPaddingAndBorder(
      const ABI29_0_0YGFlexDirection axis,
      const float widthSize);
  float getTrailingPaddingAndBorder(
      const ABI29_0_0YGFlexDirection axis,
      const float widthSize);
  float getMarginForAxis(const ABI29_0_0YGFlexDirection axis, const float widthSize);
  // Setters

  void setContext(void* context);
  void setPrintFunc(ABI29_0_0YGPrintFunc printFunc);
  void setHasNewLayout(bool hasNewLayout);
  void setNodeType(ABI29_0_0YGNodeType nodeTye);
  void setMeasureFunc(ABI29_0_0YGMeasureFunc measureFunc);
  void setBaseLineFunc(ABI29_0_0YGBaselineFunc baseLineFunc);
  void setDirtiedFunc(ABI29_0_0YGDirtiedFunc dirtiedFunc);
  void setStyle(ABI29_0_0YGStyle style);
  void setStyleFlexDirection(ABI29_0_0YGFlexDirection direction);
  void setStyleAlignContent(ABI29_0_0YGAlign alignContent);
  void setLayout(ABI29_0_0YGLayout layout);
  void setLineIndex(uint32_t lineIndex);
  void setParent(ABI29_0_0YGNodeRef parent);
  void setChildren(ABI29_0_0YGVector children);
  void setNextChild(ABI29_0_0YGNodeRef nextChild);
  void setConfig(ABI29_0_0YGConfigRef config);
  void setDirty(bool isDirty);
  void setLayoutLastParentDirection(ABI29_0_0YGDirection direction);
  void setLayoutComputedFlexBasis(float computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, int index);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimension, int index);
  void setLayoutDirection(ABI29_0_0YGDirection direction);
  void setLayoutMargin(float margin, int index);
  void setLayoutBorder(float border, int index);
  void setLayoutPadding(float padding, int index);
  void setLayoutPosition(float position, int index);
  void setPosition(
      const ABI29_0_0YGDirection direction,
      const float mainSize,
      const float crossSize,
      const float parentWidth);
  void setAndPropogateUseLegacyFlag(bool useLegacyFlag);
  void setLayoutDoesLegacyFlagAffectsLayout(bool doesLegacyFlagAffectsLayout);
  void setLayoutDidUseLegacyFlag(bool didUseLegacyFlag);
  void markDirtyAndPropogateDownwards();

  // Other methods
  ABI29_0_0YGValue marginLeadingValue(const ABI29_0_0YGFlexDirection axis) const;
  ABI29_0_0YGValue marginTrailingValue(const ABI29_0_0YGFlexDirection axis) const;
  ABI29_0_0YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  ABI29_0_0YGDirection resolveDirection(const ABI29_0_0YGDirection parentDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(ABI29_0_0YGNodeRef oldChild, ABI29_0_0YGNodeRef newChild);
  void replaceChild(ABI29_0_0YGNodeRef child, uint32_t index);
  void insertChild(ABI29_0_0YGNodeRef child, uint32_t index);
  /// Removes the first occurrence of child
  bool removeChild(ABI29_0_0YGNodeRef child);
  void removeChild(uint32_t index);

  void cloneChildrenIfNeeded();
  void markDirtyAndPropogate();
  float resolveFlexGrow();
  float resolveFlexShrink();
  bool isNodeFlexible();
  bool didUseLegacyFlag();
  bool isLayoutTreeEqualToNode(const ABI29_0_0YGNode& node) const;
};
