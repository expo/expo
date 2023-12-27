/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <cstdint>
#include <stdio.h>
#include "ABI42_0_0BitUtils.h"
#include "ABI42_0_0CompactValue.h"
#include "ABI42_0_0YGConfig.h"
#include "ABI42_0_0YGLayout.h"
#include "ABI42_0_0YGStyle.h"
#include "ABI42_0_0YGMacros.h"
#include "ABI42_0_0Yoga-internal.h"

ABI42_0_0YGConfigRef ABI42_0_0YGConfigGetDefault();

struct YOGA_EXPORT ABI42_0_0YGNode {
  using MeasureWithContextFn =
      ABI42_0_0YGSize (*)(ABI42_0_0YGNode*, float, ABI42_0_0YGMeasureMode, float, ABI42_0_0YGMeasureMode, void*);
  using BaselineWithContextFn = float (*)(ABI42_0_0YGNode*, float, float, void*);
  using PrintWithContextFn = void (*)(ABI42_0_0YGNode*, void*);

private:
  static constexpr size_t hasNewLayout_ = 0;
  static constexpr size_t isReferenceBaseline_ = 1;
  static constexpr size_t isDirty_ = 2;
  static constexpr size_t nodeType_ = 3;
  static constexpr size_t measureUsesContext_ = 4;
  static constexpr size_t baselineUsesContext_ = 5;
  static constexpr size_t printUsesContext_ = 6;
  static constexpr size_t useWebDefaults_ = 7;

  void* context_ = nullptr;
  uint8_t flags = 1;
  uint8_t reserved_ = 0;
  union {
    ABI42_0_0YGMeasureFunc noContext;
    MeasureWithContextFn withContext;
  } measure_ = {nullptr};
  union {
    ABI42_0_0YGBaselineFunc noContext;
    BaselineWithContextFn withContext;
  } baseline_ = {nullptr};
  union {
    ABI42_0_0YGPrintFunc noContext;
    PrintWithContextFn withContext;
  } print_ = {nullptr};
  ABI42_0_0YGDirtiedFunc dirtied_ = nullptr;
  ABI42_0_0YGStyle style_ = {};
  ABI42_0_0YGLayout layout_ = {};
  uint32_t lineIndex_ = 0;
  ABI42_0_0YGNodeRef owner_ = nullptr;
  ABI42_0_0YGVector children_ = {};
  ABI42_0_0YGConfigRef config_;
  std::array<ABI42_0_0YGValue, 2> resolvedDimensions_ = {
      {ABI42_0_0YGValueUndefined, ABI42_0_0YGValueUndefined}};

  ABI42_0_0YGFloatOptional relativePosition(
      const ABI42_0_0YGFlexDirection axis,
      const float axisSize) const;

  void setMeasureFunc(decltype(measure_));
  void setBaselineFunc(decltype(baseline_));

  void useWebDefaults() {
    ABI42_0_0facebook::yoga::detail::setBooleanData(flags, useWebDefaults_, true);
    style_.flexDirection() = ABI42_0_0YGFlexDirectionRow;
    style_.alignContent() = ABI42_0_0YGAlignStretch;
  }

  // DANGER DANGER DANGER!
  // If the node assigned to has children, we'd either have to deallocate
  // them (potentially incorrect) or ignore them (danger of leaks). Only ever
  // use this after checking that there are no children.
  // DO NOT CHANGE THE VISIBILITY OF THIS METHOD!
  ABI42_0_0YGNode& operator=(ABI42_0_0YGNode&&) = default;

  using CompactValue = ABI42_0_0facebook::yoga::detail::CompactValue;

public:
  ABI42_0_0YGNode() : ABI42_0_0YGNode{ABI42_0_0YGConfigGetDefault()} {}
  explicit ABI42_0_0YGNode(const ABI42_0_0YGConfigRef config) : config_{config} {
    if (config->useWebDefaults) {
      useWebDefaults();
    }
  };
  ~ABI42_0_0YGNode() = default; // cleanup of owner/children relationships in ABI42_0_0YGNodeFree

  ABI42_0_0YGNode(ABI42_0_0YGNode&&);

  // Does not expose true value semantics, as children are not cloned eagerly.
  // Should we remove this?
  ABI42_0_0YGNode(const ABI42_0_0YGNode& node) = default;

  // for RB fabric
  ABI42_0_0YGNode(const ABI42_0_0YGNode& node, ABI42_0_0YGConfigRef config);

  // assignment means potential leaks of existing children, or alternatively
  // freeing unowned memory, double free, or freeing stack memory.
  ABI42_0_0YGNode& operator=(const ABI42_0_0YGNode&) = delete;

  // Getters
  void* getContext() const { return context_; }

  uint8_t& reserved() { return reserved_; }
  uint8_t reserved() const { return reserved_; }

  void print(void*);

  bool getHasNewLayout() const {
    return ABI42_0_0facebook::yoga::detail::getBooleanData(flags, hasNewLayout_);
  }

  ABI42_0_0YGNodeType getNodeType() const {
    return ABI42_0_0facebook::yoga::detail::getEnumData<ABI42_0_0YGNodeType>(flags, nodeType_);
  }

  bool hasMeasureFunc() const noexcept { return measure_.noContext != nullptr; }

  ABI42_0_0YGSize measure(float, ABI42_0_0YGMeasureMode, float, ABI42_0_0YGMeasureMode, void*);

  bool hasBaselineFunc() const noexcept {
    return baseline_.noContext != nullptr;
  }

  float baseline(float width, float height, void* layoutContext);

  ABI42_0_0YGDirtiedFunc getDirtied() const { return dirtied_; }

  // For Performance reasons passing as reference.
  ABI42_0_0YGStyle& getStyle() { return style_; }

  const ABI42_0_0YGStyle& getStyle() const { return style_; }

  // For Performance reasons passing as reference.
  ABI42_0_0YGLayout& getLayout() { return layout_; }

  const ABI42_0_0YGLayout& getLayout() const { return layout_; }

  uint32_t getLineIndex() const { return lineIndex_; }

  bool isReferenceBaseline() {
    return ABI42_0_0facebook::yoga::detail::getBooleanData(flags, isReferenceBaseline_);
  }

  // returns the ABI42_0_0YGNodeRef that owns this ABI42_0_0YGNode. An owner is used to identify
  // the YogaTree that a ABI42_0_0YGNode belongs to. This method will return the parent
  // of the ABI42_0_0YGNode when a ABI42_0_0YGNode only belongs to one YogaTree or nullptr when
  // the ABI42_0_0YGNode is shared between two or more YogaTrees.
  ABI42_0_0YGNodeRef getOwner() const { return owner_; }

  // Deprecated, use getOwner() instead.
  ABI42_0_0YGNodeRef getParent() const { return getOwner(); }

  const ABI42_0_0YGVector& getChildren() const { return children_; }

  // Applies a callback to all children, after cloning them if they are not
  // owned.
  template <typename T>
  void iterChildrenAfterCloningIfNeeded(T callback, void* cloneContext) {
    int i = 0;
    for (ABI42_0_0YGNodeRef& child : children_) {
      if (child->getOwner() != this) {
        child = config_->cloneNode(child, this, i, cloneContext);
        child->setOwner(this);
      }
      i += 1;

      callback(child, cloneContext);
    }
  }

  ABI42_0_0YGNodeRef getChild(uint32_t index) const { return children_.at(index); }

  ABI42_0_0YGConfigRef getConfig() const { return config_; }

  bool isDirty() const {
    return ABI42_0_0facebook::yoga::detail::getBooleanData(flags, isDirty_);
  }

  std::array<ABI42_0_0YGValue, 2> getResolvedDimensions() const {
    return resolvedDimensions_;
  }

  ABI42_0_0YGValue getResolvedDimension(int index) const {
    return resolvedDimensions_[index];
  }

  // Methods related to positions, margin, padding and border
  ABI42_0_0YGFloatOptional getLeadingPosition(
      const ABI42_0_0YGFlexDirection axis,
      const float axisSize) const;
  bool isLeadingPositionDefined(const ABI42_0_0YGFlexDirection axis) const;
  bool isTrailingPosDefined(const ABI42_0_0YGFlexDirection axis) const;
  ABI42_0_0YGFloatOptional getTrailingPosition(
      const ABI42_0_0YGFlexDirection axis,
      const float axisSize) const;
  ABI42_0_0YGFloatOptional getLeadingMargin(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI42_0_0YGFloatOptional getTrailingMargin(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  float getLeadingBorder(const ABI42_0_0YGFlexDirection flexDirection) const;
  float getTrailingBorder(const ABI42_0_0YGFlexDirection flexDirection) const;
  ABI42_0_0YGFloatOptional getLeadingPadding(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI42_0_0YGFloatOptional getTrailingPadding(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI42_0_0YGFloatOptional getLeadingPaddingAndBorder(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI42_0_0YGFloatOptional getTrailingPaddingAndBorder(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  ABI42_0_0YGFloatOptional getMarginForAxis(
      const ABI42_0_0YGFlexDirection axis,
      const float widthSize) const;
  // Setters

  void setContext(void* context) { context_ = context; }

  void setPrintFunc(ABI42_0_0YGPrintFunc printFunc) {
    print_.noContext = printFunc;
    ABI42_0_0facebook::yoga::detail::setBooleanData(flags, printUsesContext_, false);
  }
  void setPrintFunc(PrintWithContextFn printFunc) {
    print_.withContext = printFunc;
    ABI42_0_0facebook::yoga::detail::setBooleanData(flags, printUsesContext_, true);
  }
  void setPrintFunc(std::nullptr_t) { setPrintFunc(ABI42_0_0YGPrintFunc{nullptr}); }

  void setHasNewLayout(bool hasNewLayout) {
    ABI42_0_0facebook::yoga::detail::setBooleanData(flags, hasNewLayout_, hasNewLayout);
  }

  void setNodeType(ABI42_0_0YGNodeType nodeType) {
    return ABI42_0_0facebook::yoga::detail::setEnumData<ABI42_0_0YGNodeType>(
        flags, nodeType_, nodeType);
  }

  void setMeasureFunc(ABI42_0_0YGMeasureFunc measureFunc);
  void setMeasureFunc(MeasureWithContextFn);
  void setMeasureFunc(std::nullptr_t) {
    return setMeasureFunc(ABI42_0_0YGMeasureFunc{nullptr});
  }

  void setBaselineFunc(ABI42_0_0YGBaselineFunc baseLineFunc) {
    ABI42_0_0facebook::yoga::detail::setBooleanData(flags, baselineUsesContext_, false);
    baseline_.noContext = baseLineFunc;
  }
  void setBaselineFunc(BaselineWithContextFn baseLineFunc) {
    ABI42_0_0facebook::yoga::detail::setBooleanData(flags, baselineUsesContext_, true);
    baseline_.withContext = baseLineFunc;
  }
  void setBaselineFunc(std::nullptr_t) {
    return setBaselineFunc(ABI42_0_0YGBaselineFunc{nullptr});
  }

  void setDirtiedFunc(ABI42_0_0YGDirtiedFunc dirtiedFunc) { dirtied_ = dirtiedFunc; }

  void setStyle(const ABI42_0_0YGStyle& style) { style_ = style; }

  void setLayout(const ABI42_0_0YGLayout& layout) { layout_ = layout; }

  void setLineIndex(uint32_t lineIndex) { lineIndex_ = lineIndex; }

  void setIsReferenceBaseline(bool isReferenceBaseline) {
    ABI42_0_0facebook::yoga::detail::setBooleanData(
        flags, isReferenceBaseline_, isReferenceBaseline);
  }

  void setOwner(ABI42_0_0YGNodeRef owner) { owner_ = owner; }

  void setChildren(const ABI42_0_0YGVector& children) { children_ = children; }

  // TODO: rvalue override for setChildren

  ABI42_0_0YG_DEPRECATED void setConfig(ABI42_0_0YGConfigRef config) { config_ = config; }

  void setDirty(bool isDirty);
  void setLayoutLastOwnerDirection(ABI42_0_0YGDirection direction);
  void setLayoutComputedFlexBasis(const ABI42_0_0YGFloatOptional computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, int index);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimension, int index);
  void setLayoutDirection(ABI42_0_0YGDirection direction);
  void setLayoutMargin(float margin, int index);
  void setLayoutBorder(float border, int index);
  void setLayoutPadding(float padding, int index);
  void setLayoutPosition(float position, int index);
  void setPosition(
      const ABI42_0_0YGDirection direction,
      const float mainSize,
      const float crossSize,
      const float ownerWidth);
  void setLayoutDoesLegacyFlagAffectsLayout(bool doesLegacyFlagAffectsLayout);
  void setLayoutDidUseLegacyFlag(bool didUseLegacyFlag);
  void markDirtyAndPropogateDownwards();

  // Other methods
  ABI42_0_0YGValue marginLeadingValue(const ABI42_0_0YGFlexDirection axis) const;
  ABI42_0_0YGValue marginTrailingValue(const ABI42_0_0YGFlexDirection axis) const;
  ABI42_0_0YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  ABI42_0_0YGDirection resolveDirection(const ABI42_0_0YGDirection ownerDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(ABI42_0_0YGNodeRef oldChild, ABI42_0_0YGNodeRef newChild);
  void replaceChild(ABI42_0_0YGNodeRef child, uint32_t index);
  void insertChild(ABI42_0_0YGNodeRef child, uint32_t index);
  /// Removes the first occurrence of child
  bool removeChild(ABI42_0_0YGNodeRef child);
  void removeChild(uint32_t index);

  void cloneChildrenIfNeeded(void*);
  void markDirtyAndPropogate();
  float resolveFlexGrow() const;
  float resolveFlexShrink() const;
  bool isNodeFlexible();
  bool didUseLegacyFlag();
  bool isLayoutTreeEqualToNode(const ABI42_0_0YGNode& node) const;
  void reset();
};
