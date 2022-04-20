/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0YogaLayoutableShadowNode.h"
#include <ABI45_0_0logger/ABI45_0_0React_native_log.h>
#include <ABI45_0_0React/ABI45_0_0debug/flags.h>
#include <ABI45_0_0React/ABI45_0_0debug/ABI45_0_0React_native_assert.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/conversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/LayoutConstraints.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/LayoutContext.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/DebugStringConvertibleItem.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/SystraceSection.h>
#include <ABI45_0_0yoga/ABI45_0_0Yoga.h>
#include <algorithm>
#include <limits>
#include <memory>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

static int FabricDefaultYogaLog(
    const ABI45_0_0YGConfigRef,
    const ABI45_0_0YGNodeRef,
    ABI45_0_0YGLogLevel level,
    const char *format,
    va_list args) {
  va_list args_copy;
  va_copy(args_copy, args);

  // Adding 1 to add space for terminating null character.
  int size_s = vsnprintf(nullptr, 0, format, args);
  auto size = static_cast<size_t>(size_s);
  std::vector<char> buffer(size);

  vsnprintf(buffer.data(), size, format, args_copy);
  switch (level) {
    case ABI45_0_0YGLogLevelError:
      ABI45_0_0React_native_log_error(buffer.data());
      break;
    case ABI45_0_0YGLogLevelFatal:
      ABI45_0_0React_native_log_fatal(buffer.data());
      break;
    case ABI45_0_0YGLogLevelWarn:
      ABI45_0_0React_native_log_warn(buffer.data());
      break;
    case ABI45_0_0YGLogLevelInfo:
    case ABI45_0_0YGLogLevelDebug:
    case ABI45_0_0YGLogLevelVerbose:
    default:
      ABI45_0_0React_native_log_info(buffer.data());
  }

  return size_s;
}

thread_local LayoutContext threadLocalLayoutContext;

ShadowNodeTraits YogaLayoutableShadowNode::BaseTraits() {
  auto traits = LayoutableShadowNode::BaseTraits();
  traits.set(ShadowNodeTraits::Trait::YogaLayoutableKind);
  return traits;
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : LayoutableShadowNode(fragment, family, traits),
      yogaConfig_(FabricDefaultYogaLog),
      yogaNode_(&initializeYogaConfig(yogaConfig_)) {
  yogaNode_.setContext(this);

  // Newly created node must be `dirty` just becasue it is new.
  // This is not a default for `ABI45_0_0YGNode`.
  yogaNode_.setDirty(true);

  if (getTraits().check(ShadowNodeTraits::Trait::MeasurableYogaNode)) {
    ABI45_0_0React_native_assert(
        getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

    yogaNode_.setMeasureFunc(
        YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
  }

  updateYogaProps();
  updateYogaChildren();

  ensureConsistency();
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : LayoutableShadowNode(sourceShadowNode, fragment),
      yogaConfig_(FabricDefaultYogaLog),
      yogaNode_(
          static_cast<YogaLayoutableShadowNode const &>(sourceShadowNode)
              .yogaNode_,
          &initializeYogaConfig(yogaConfig_)) {
  // Note, cloned `ABI45_0_0YGNode` instance (copied using copy-constructor) inherits
  // dirty flag, measure function, and other properties being set originally in
  // the `YogaLayoutableShadowNode` constructor above.

  ABI45_0_0React_native_assert(
      static_cast<YogaLayoutableShadowNode const &>(sourceShadowNode)
              .yogaNode_.isDirty() == yogaNode_.isDirty() &&
      "Yoga node must inherit dirty flag.");

  yogaNode_.setContext(this);
  yogaNode_.setOwner(nullptr);
  updateYogaChildrenOwnersIfNeeded();

  // This is the only legit place where we can dirty cloned Yoga node.
  // If we do it later, ancestor nodes will not be able to observe this and
  // dirty (and clone) themselves as a result.
  if (getTraits().check(ShadowNodeTraits::Trait::DirtyYogaNode) ||
      getTraits().check(ShadowNodeTraits::Trait::MeasurableYogaNode)) {
    yogaNode_.setDirty(true);
  }

  if (fragment.props) {
    updateYogaProps();
  }

  if (fragment.children) {
    updateYogaChildren();
  }

  ensureConsistency();
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_.setDirty(true);
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !yogaNode_.isDirty();
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  yogaNode_.setMeasureFunc(
      YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendYogaChild(ShadowNode const &childNode) {
  // The caller must check this before calling this method.
  ABI45_0_0React_native_assert(
      !getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

  ensureYogaChildrenLookFine();

  auto &layoutableChildNode =
      traitCast<YogaLayoutableShadowNode const &>(childNode);
  yogaNode_.insertChild(
      &layoutableChildNode.yogaNode_,
      static_cast<uint32_t>(yogaNode_.getChildren().size()));

  ensureYogaChildrenLookFine();
}

void YogaLayoutableShadowNode::adoptYogaChild(size_t index) {
  ensureUnsealed();
  ensureYogaChildrenLookFine();

  // The caller must check this before calling this method.
  ABI45_0_0React_native_assert(
      !getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

  auto &children = getChildren();

  // Overflow checks.
  ABI45_0_0React_native_assert(children.size() > index);
  ABI45_0_0React_native_assert(children.size() >= yogaNode_.getChildren().size());

  auto &childNode = *children.at(index);

  auto &layoutableChildNode =
      traitCast<YogaLayoutableShadowNode const &>(childNode);

  // Note, the following (commented out) assert is conceptually valid but still
  // might produce false-positive signals because of the ABA problem (different
  // objects with non-interleaving life-times being allocated on the same
  // address). ABI45_0_0React_native_assert(layoutableChildNode.yogaNode_.getOwner() !=
  // &yogaNode_);

  if (layoutableChildNode.yogaNode_.getOwner() == nullptr) {
    // The child node is not owned.
    layoutableChildNode.yogaNode_.setOwner(&yogaNode_);
    // At this point the child yoga node must be already inserted by the caller.
    // ABI45_0_0React_native_assert(layoutableChildNode.yogaNode_.isDirty());
  } else {
    // The child is owned by some other node, we need to clone that.
    auto clonedChildNode = childNode.clone({});
    auto &layoutableClonedChildNode =
        traitCast<YogaLayoutableShadowNode const &>(*clonedChildNode);

    // The owner must be nullptr for a newly cloned node.
    ABI45_0_0React_native_assert(
        layoutableClonedChildNode.yogaNode_.getOwner() == nullptr);

    // Establishing ownership.
    layoutableClonedChildNode.yogaNode_.setOwner(&yogaNode_);

    // Replace the child node with a newly cloned one in the children list.
    replaceChild(childNode, clonedChildNode, static_cast<int>(index));

    // Replace the Yoga node inside the Yoga node children list.
    yogaNode_.replaceChild(
        &layoutableClonedChildNode.yogaNode_, static_cast<int>(index));
  }

  ensureYogaChildrenLookFine();
}

void YogaLayoutableShadowNode::appendChild(
    ShadowNode::Shared const &childNode) {
  ensureUnsealed();
  ensureConsistency();

  // Calling the base class (`ShadowNode`) mehtod.
  LayoutableShadowNode::appendChild(childNode);

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    // This node is a declared leaf.
    return;
  }

  // Here we don't have information about the previous structure of the node (if
  // it that existed before), so we don't have anything to compare the Yoga node
  // with (like a previous version of this node). Therefore we must dirty the
  // node.
  yogaNode_.setDirty(true);

  // All children of a non-leaf `YogaLayoutableShadowNode` must be a
  // `YogaLayoutableShadowNode`s to be appended. This happens when invalid
  // string/numeric child is passed which is not YogaLayoutableShadowNode
  // (e.g. ABI45_0_0RCTRawText). This used to throw an error, but we are ignoring it
  // because we want core library components to be fault-tolerant and degrade
  // gracefully. A soft error will be emitted from JavaScript.
  if (traitCast<YogaLayoutableShadowNode const *>(childNode.get())) {
    // Appending the Yoga node.
    appendYogaChild(*childNode);

    ensureYogaChildrenLookFine();
    ensureYogaChildrenAlighment();

    // Adopting the Yoga node.
    adoptYogaChild(getChildren().size() - 1);

    ensureConsistency();
  } else {
    ABI45_0_0React_native_log_error(
        "Text strings must be rendered within a <Text> component.");
  }
}

bool YogaLayoutableShadowNode::doesOwn(
    YogaLayoutableShadowNode const &child) const {
  return child.yogaNode_.getOwner() == &yogaNode_;
}

void YogaLayoutableShadowNode::updateYogaChildrenOwnersIfNeeded() {
  for (auto &childYogaNode : yogaNode_.getChildren()) {
    if (childYogaNode->getOwner() == &yogaNode_) {
      childYogaNode->setOwner(reinterpret_cast<ABI45_0_0YGNodeRef>(0xBADC0FFEE0DDF00D));
    }
  }
}

void YogaLayoutableShadowNode::updateYogaChildren() {
  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    return;
  }

  ensureUnsealed();

  bool isClean = !yogaNode_.isDirty() &&
      getChildren().size() == yogaNode_.getChildren().size();

  auto oldYogaChildren = isClean ? yogaNode_.getChildren() : ABI45_0_0YGVector{};
  yogaNode_.setChildren({});

  for (size_t i = 0; i < getChildren().size(); i++) {
    appendYogaChild(*getChildren().at(i));
    adoptYogaChild(i);

    if (isClean) {
      auto &oldYogaChildNode = *oldYogaChildren[i];
      auto &newYogaChildNode =
          traitCast<YogaLayoutableShadowNode const &>(*getChildren().at(i))
              .yogaNode_;

      isClean = isClean && !newYogaChildNode.isDirty() &&
          (newYogaChildNode.getStyle() == oldYogaChildNode.getStyle());
    }
  }

  ABI45_0_0React_native_assert(getChildren().size() == yogaNode_.getChildren().size());

  yogaNode_.setDirty(!isClean);
}

void YogaLayoutableShadowNode::updateYogaProps() {
  ensureUnsealed();

  auto props = static_cast<YogaStylableProps const &>(*props_);

  // Resetting `dirty` flag only if `yogaStyle` portion of `Props` was changed.
  if (!yogaNode_.isDirty() && (props.yogaStyle != yogaNode_.getStyle())) {
    yogaNode_.setDirty(true);
  }

  yogaNode_.setStyle(props.yogaStyle);
}

void YogaLayoutableShadowNode::setSize(Size size) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.dimensions()[ABI45_0_0YGDimensionWidth] = yogaStyleValueFromFloat(size.width);
  style.dimensions()[ABI45_0_0YGDimensionHeight] = yogaStyleValueFromFloat(size.height);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPadding(RectangleEdges<Float> padding) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();

  auto leftPadding = yogaStyleValueFromFloat(padding.left);
  auto topPadding = yogaStyleValueFromFloat(padding.top);
  auto rightPadding = yogaStyleValueFromFloat(padding.right);
  auto bottomPadding = yogaStyleValueFromFloat(padding.bottom);

  if (leftPadding != style.padding()[ABI45_0_0YGEdgeLeft] ||
      topPadding != style.padding()[ABI45_0_0YGEdgeTop] ||
      rightPadding != style.padding()[ABI45_0_0YGEdgeRight] ||
      bottomPadding != style.padding()[ABI45_0_0YGEdgeBottom]) {
    style.padding()[ABI45_0_0YGEdgeTop] = yogaStyleValueFromFloat(padding.top);
    style.padding()[ABI45_0_0YGEdgeLeft] = yogaStyleValueFromFloat(padding.left);
    style.padding()[ABI45_0_0YGEdgeRight] = yogaStyleValueFromFloat(padding.right);
    style.padding()[ABI45_0_0YGEdgeBottom] = yogaStyleValueFromFloat(padding.bottom);
    yogaNode_.setStyle(style);
    yogaNode_.setDirty(true);
  }
}

void YogaLayoutableShadowNode::setPositionType(
    ABI45_0_0YGPositionType positionType) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.positionType() = positionType;
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::layoutTree(
    LayoutContext layoutContext,
    LayoutConstraints layoutConstraints) {
  ensureUnsealed();

  /*
   * In Yoga, every single Yoga Node has to have a (non-null) pointer to
   * Yoga Config (this config can be shared between many nodes),
   * so every node can be individually configured. This does *not* mean
   * however that Yoga consults with every single Yoga Node Config for every
   * config parameter. Especially in case of `pointScaleFactor`,
   * the only value in the config of the root node is taken into account
   * (and this is by design).
   */
  yogaConfig_.pointScaleFactor = layoutContext.pointScaleFactor;

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  // The caller must ensure that layout constraints make sense.
  // Values cannot be NaN.
  ABI45_0_0React_native_assert(!std::isnan(minimumSize.width));
  ABI45_0_0React_native_assert(!std::isnan(minimumSize.height));
  ABI45_0_0React_native_assert(!std::isnan(maximumSize.width));
  ABI45_0_0React_native_assert(!std::isnan(maximumSize.height));
  // Values cannot be negative.
  ABI45_0_0React_native_assert(minimumSize.width >= 0);
  ABI45_0_0React_native_assert(minimumSize.height >= 0);
  ABI45_0_0React_native_assert(maximumSize.width >= 0);
  ABI45_0_0React_native_assert(maximumSize.height >= 0);
  // Mimimum size cannot be infinity.
  ABI45_0_0React_native_assert(!std::isinf(minimumSize.width));
  ABI45_0_0React_native_assert(!std::isinf(minimumSize.height));

  // Internally Yoga uses three different measurement modes controlling layout
  // constraints: `Undefined`, `Exactly`, and `AtMost`. These modes are an
  // implementation detail and are not defined in `CSS Flexible Box Layout
  // Module`. Yoga C++ API (and `ABI45_0_0YGNodeCalculateLayout` function particularly)
  // does not allow to specify the measure modes explicitly. Instead, it infers
  // these from styles associated with the root node.
  // To pass the actual layout constraints to Yoga we represent them as
  // `(min/max)(Height/Width)` style properties. Also, we pass `ownerWidth` &
  // `ownerHeight` to allow proper calculation of relative (e.g. specified in
  // percents) style values.

  auto &yogaStyle = yogaNode_.getStyle();

  auto ownerWidth = yogaFloatFromFloat(maximumSize.width);
  auto ownerHeight = yogaFloatFromFloat(maximumSize.height);

  yogaStyle.maxDimensions()[ABI45_0_0YGDimensionWidth] = std::isfinite(maximumSize.width)
      ? yogaStyleValueFromFloat(maximumSize.width)
      : ABI45_0_0YGValueUndefined;

  yogaStyle.maxDimensions()[ABI45_0_0YGDimensionHeight] =
      std::isfinite(maximumSize.height)
      ? yogaStyleValueFromFloat(maximumSize.height)
      : ABI45_0_0YGValueUndefined;

  yogaStyle.minDimensions()[ABI45_0_0YGDimensionWidth] = minimumSize.width > 0
      ? yogaStyleValueFromFloat(minimumSize.width)
      : ABI45_0_0YGValueUndefined;

  yogaStyle.minDimensions()[ABI45_0_0YGDimensionHeight] = minimumSize.height > 0
      ? yogaStyleValueFromFloat(minimumSize.height)
      : ABI45_0_0YGValueUndefined;

  auto direction =
      yogaDirectionFromLayoutDirection(layoutConstraints.layoutDirection);

  threadLocalLayoutContext = layoutContext;

  if (layoutContext.swapLeftAndRightInRTL) {
    swapLeftAndRightInTree(*this);
  }

  {
    SystraceSection s("YogaLayoutableShadowNode::ABI45_0_0YGNodeCalculateLayout");
    ABI45_0_0YGNodeCalculateLayout(&yogaNode_, ownerWidth, ownerHeight, direction);
  }

  if (yogaNode_.getHasNewLayout()) {
    auto layoutMetrics = layoutMetricsFromYogaNode(yogaNode_);
    layoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    setLayoutMetrics(layoutMetrics);
    yogaNode_.setHasNewLayout(false);
  }

  layout(layoutContext);
}

static EdgeInsets calculateOverflowInset(
    Rect containerFrame,
    Rect contentFrame) {
  auto size = containerFrame.size;
  auto overflowInset = EdgeInsets{};
  overflowInset.left = std::min(contentFrame.getMinX(), Float{0.0});
  overflowInset.top = std::min(contentFrame.getMinY(), Float{0.0});
  overflowInset.right =
      -std::max(contentFrame.getMaxX() - size.width, Float{0.0});
  overflowInset.bottom =
      -std::max(contentFrame.getMaxY() - size.height, Float{0.0});
  return overflowInset;
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  // Reading data from a dirtied node does not make sense.
  ABI45_0_0React_native_assert(!yogaNode_.isDirty());

  auto contentFrame = Rect{};

  for (auto childYogaNode : yogaNode_.getChildren()) {
    auto &childNode =
        *static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());

    // Verifying that the Yoga node belongs to the ShadowNode.
    ABI45_0_0React_native_assert(&childNode.yogaNode_ == childYogaNode);

    if (childYogaNode->getHasNewLayout()) {
      childYogaNode->setHasNewLayout(false);

      // Reading data from a dirtied node does not make sense.
      ABI45_0_0React_native_assert(!childYogaNode->isDirty());

      // We must copy layout metrics from Yoga node only once (when the parent
      // node exclusively ownes the child node).
      ABI45_0_0React_native_assert(childYogaNode->getOwner() == &yogaNode_);

      // We are about to mutate layout metrics of the node.
      childNode.ensureUnsealed();

      auto newLayoutMetrics = layoutMetricsFromYogaNode(*childYogaNode);
      newLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;

      // Child node's layout has changed. When a node is added to
      // `affectedNodes`, onLayout event is called on the component. Comparing
      // `newLayoutMetrics.frame` with `childNode.getLayoutMetrics().frame` to
      // detect if layout has not changed is not advised, please refer to
      // D22999891 for details.
      if (layoutContext.affectedNodes) {
        layoutContext.affectedNodes->push_back(&childNode);
      }

      childNode.setLayoutMetrics(newLayoutMetrics);

      if (newLayoutMetrics.displayType != DisplayType::None) {
        childNode.layout(layoutContext);
      }
    }

    auto layoutMetricsWithOverflowInset = childNode.getLayoutMetrics();
    if (layoutMetricsWithOverflowInset.displayType != DisplayType::None) {
      contentFrame.unionInPlace(insetBy(
          layoutMetricsWithOverflowInset.frame,
          layoutMetricsWithOverflowInset.overflowInset));
    }
  }

  if (yogaNode_.getStyle().overflow() == ABI45_0_0YGOverflowVisible) {
    auto transform = getTransform();
    auto transformedContentFrame = contentFrame;
    if (Transform::Identity() != transform) {
      // When animation uses native driver, Yoga has no knowledge of the
      // animation. In case the content goes out from current container, we need
      // to union the content frame with its transformed frame.
      transformedContentFrame = contentFrame * getTransform();
      transformedContentFrame.unionInPlace(contentFrame);
    }
    layoutMetrics_.overflowInset =
        calculateOverflowInset(layoutMetrics_.frame, transformedContentFrame);
  } else {
    layoutMetrics_.overflowInset = {};
  }
}

#pragma mark - Yoga Connectors

ABI45_0_0YGNode *YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(
    ABI45_0_0YGNode *oldYogaNode,
    ABI45_0_0YGNode *parentYogaNode,
    int childIndex) {
  SystraceSection s("YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector");

  // At this point it is guaranteed that all shadow nodes associated with yoga
  // nodes are `YogaLayoutableShadowNode` subclasses.
  auto parentNode =
      static_cast<YogaLayoutableShadowNode *>(parentYogaNode->getContext());
  auto oldNode =
      static_cast<YogaLayoutableShadowNode *>(oldYogaNode->getContext());

  auto clonedNode = oldNode->clone(
      {ShadowNodeFragment::propsPlaceholder(),
       ShadowNodeFragment::childrenPlaceholder(),
       oldNode->getState()});
  parentNode->replaceChild(*oldNode, clonedNode, childIndex);
  return &static_cast<YogaLayoutableShadowNode &>(*clonedNode).yogaNode_;
}

ABI45_0_0YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(
    ABI45_0_0YGNode *yogaNode,
    float width,
    ABI45_0_0YGMeasureMode widthMode,
    float height,
    ABI45_0_0YGMeasureMode heightMode) {
  SystraceSection s(
      "YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector");

  auto shadowNodeRawPtr =
      static_cast<YogaLayoutableShadowNode *>(yogaNode->getContext());

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{
      std::numeric_limits<Float>::infinity(),
      std::numeric_limits<Float>::infinity()};

  switch (widthMode) {
    case ABI45_0_0YGMeasureModeUndefined:
      break;
    case ABI45_0_0YGMeasureModeExactly:
      minimumSize.width = floatFromYogaFloat(width);
      maximumSize.width = floatFromYogaFloat(width);
      break;
    case ABI45_0_0YGMeasureModeAtMost:
      maximumSize.width = floatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case ABI45_0_0YGMeasureModeUndefined:
      break;
    case ABI45_0_0YGMeasureModeExactly:
      minimumSize.height = floatFromYogaFloat(height);
      maximumSize.height = floatFromYogaFloat(height);
      break;
    case ABI45_0_0YGMeasureModeAtMost:
      maximumSize.height = floatFromYogaFloat(height);
      break;
  }

  auto size = shadowNodeRawPtr->measureContent(
      threadLocalLayoutContext, {minimumSize, maximumSize});

  return ABI45_0_0YGSize{
      yogaFloatFromFloat(size.width), yogaFloatFromFloat(size.height)};
}

ABI45_0_0YGConfig &YogaLayoutableShadowNode::initializeYogaConfig(ABI45_0_0YGConfig &config) {
  config.setCloneNodeCallback(
      YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector);
  config.useLegacyStretchBehaviour = true;
#ifdef ABI45_0_0RN_DEBUG_YOGA_LOGGER
  config.printTree = true;
#endif
  return config;
}

#pragma mark - RTL left and right swapping

void YogaLayoutableShadowNode::swapLeftAndRightInTree(
    YogaLayoutableShadowNode const &shadowNode) {
  swapLeftAndRightInYogaStyleProps(shadowNode);
  swapLeftAndRightInViewProps(shadowNode);

  for (auto &child : shadowNode.getChildren()) {
    auto const yogaLayoutableChild =
        traitCast<YogaLayoutableShadowNode const *>(child.get());
    if (yogaLayoutableChild && !yogaLayoutableChild->doesOwn(shadowNode)) {
      swapLeftAndRightInTree(*yogaLayoutableChild);
    }
  }
}

void YogaLayoutableShadowNode::swapLeftAndRightInYogaStyleProps(
    YogaLayoutableShadowNode const &shadowNode) {
  auto yogaStyle = shadowNode.yogaNode_.getStyle();

  ABI45_0_0YGStyle::Edges const &position = yogaStyle.position();
  ABI45_0_0YGStyle::Edges const &padding = yogaStyle.padding();
  ABI45_0_0YGStyle::Edges const &margin = yogaStyle.margin();

  // Swap Yoga node values, position, padding and margin.

  if (yogaStyle.position()[ABI45_0_0YGEdgeLeft] != ABI45_0_0YGValueUndefined) {
    yogaStyle.position()[ABI45_0_0YGEdgeStart] = position[ABI45_0_0YGEdgeLeft];
    yogaStyle.position()[ABI45_0_0YGEdgeLeft] = ABI45_0_0YGValueUndefined;
  }

  if (yogaStyle.position()[ABI45_0_0YGEdgeRight] != ABI45_0_0YGValueUndefined) {
    yogaStyle.position()[ABI45_0_0YGEdgeEnd] = position[ABI45_0_0YGEdgeRight];
    yogaStyle.position()[ABI45_0_0YGEdgeRight] = ABI45_0_0YGValueUndefined;
  }

  if (yogaStyle.padding()[ABI45_0_0YGEdgeLeft] != ABI45_0_0YGValueUndefined) {
    yogaStyle.padding()[ABI45_0_0YGEdgeStart] = padding[ABI45_0_0YGEdgeLeft];
    yogaStyle.padding()[ABI45_0_0YGEdgeLeft] = ABI45_0_0YGValueUndefined;
  }

  if (yogaStyle.padding()[ABI45_0_0YGEdgeRight] != ABI45_0_0YGValueUndefined) {
    yogaStyle.padding()[ABI45_0_0YGEdgeEnd] = padding[ABI45_0_0YGEdgeRight];
    yogaStyle.padding()[ABI45_0_0YGEdgeRight] = ABI45_0_0YGValueUndefined;
  }

  if (yogaStyle.margin()[ABI45_0_0YGEdgeLeft] != ABI45_0_0YGValueUndefined) {
    yogaStyle.margin()[ABI45_0_0YGEdgeStart] = margin[ABI45_0_0YGEdgeLeft];
    yogaStyle.margin()[ABI45_0_0YGEdgeLeft] = ABI45_0_0YGValueUndefined;
  }

  if (yogaStyle.margin()[ABI45_0_0YGEdgeRight] != ABI45_0_0YGValueUndefined) {
    yogaStyle.margin()[ABI45_0_0YGEdgeEnd] = margin[ABI45_0_0YGEdgeRight];
    yogaStyle.margin()[ABI45_0_0YGEdgeRight] = ABI45_0_0YGValueUndefined;
  }

  shadowNode.yogaNode_.setStyle(yogaStyle);
}

void YogaLayoutableShadowNode::swapLeftAndRightInViewProps(
    YogaLayoutableShadowNode const &shadowNode) {
  auto &typedCasting = static_cast<ViewProps const &>(*shadowNode.props_);
  auto &props = const_cast<ViewProps &>(typedCasting);

  // Swap border node values, borderRadii, borderColors and borderStyles.
  if (props.borderRadii.topLeft.hasValue()) {
    props.borderRadii.topStart = props.borderRadii.topLeft;
    props.borderRadii.topLeft.clear();
  }

  if (props.borderRadii.bottomLeft.hasValue()) {
    props.borderRadii.bottomStart = props.borderRadii.bottomLeft;
    props.borderRadii.bottomLeft.clear();
  }

  if (props.borderRadii.topRight.hasValue()) {
    props.borderRadii.topEnd = props.borderRadii.topRight;
    props.borderRadii.topRight.clear();
  }

  if (props.borderRadii.bottomRight.hasValue()) {
    props.borderRadii.bottomEnd = props.borderRadii.bottomRight;
    props.borderRadii.bottomRight.clear();
  }

  if (props.borderColors.left.hasValue()) {
    props.borderColors.start = props.borderColors.left;
    props.borderColors.left.clear();
  }

  if (props.borderColors.right.hasValue()) {
    props.borderColors.end = props.borderColors.right;
    props.borderColors.right.clear();
  }

  if (props.borderStyles.left.hasValue()) {
    props.borderStyles.start = props.borderStyles.left;
    props.borderStyles.left.clear();
  }

  if (props.borderStyles.right.hasValue()) {
    props.borderStyles.end = props.borderStyles.right;
    props.borderStyles.right.clear();
  }

  ABI45_0_0YGStyle::Edges const &border = props.yogaStyle.border();

  if (props.yogaStyle.border()[ABI45_0_0YGEdgeLeft] != ABI45_0_0YGValueUndefined) {
    props.yogaStyle.border()[ABI45_0_0YGEdgeStart] = border[ABI45_0_0YGEdgeLeft];
    props.yogaStyle.border()[ABI45_0_0YGEdgeLeft] = ABI45_0_0YGValueUndefined;
  }

  if (props.yogaStyle.border()[ABI45_0_0YGEdgeRight] != ABI45_0_0YGValueUndefined) {
    props.yogaStyle.border()[ABI45_0_0YGEdgeEnd] = border[ABI45_0_0YGEdgeRight];
    props.yogaStyle.border()[ABI45_0_0YGEdgeRight] = ABI45_0_0YGValueUndefined;
  }
}

#pragma mark - Consistency Ensuring Helpers

void YogaLayoutableShadowNode::ensureConsistency() const {
  ensureYogaChildrenLookFine();
  ensureYogaChildrenAlighment();
  ensureYogaChildrenOwnersConsistency();
}

void YogaLayoutableShadowNode::ensureYogaChildrenOwnersConsistency() const {
#ifdef ABI45_0_0REACT_NATIVE_DEBUG
  // Checking that all Yoga node children have the same `owner`.
  // The owner might be not equal to the `yogaNode_` though.
  auto &yogaChildren = yogaNode_.getChildren();

  if (!yogaChildren.empty()) {
    auto owner = yogaChildren.at(0)->getOwner();
    for (auto const &child : yogaChildren) {
      ABI45_0_0React_native_assert(child->getOwner() == owner);
    }
  }
#endif
}

void YogaLayoutableShadowNode::ensureYogaChildrenLookFine() const {
#ifdef ABI45_0_0REACT_NATIVE_DEBUG
  // Checking that the shapes of Yoga node children object look fine.
  // This is the only heuristic that might produce false-positive results
  // (really broken dangled nodes might look fine). This is useful as an early
  // signal that something went wrong.
  auto &yogaChildren = yogaNode_.getChildren();

  for (auto const &yogaChild : yogaChildren) {
    ABI45_0_0React_native_assert(yogaChild->getContext());
    ABI45_0_0React_native_assert(yogaChild->getChildren().size() < 16384);
    if (!yogaChild->getChildren().empty()) {
      ABI45_0_0React_native_assert(!yogaChild->hasMeasureFunc());
    }
  }
#endif
}

void YogaLayoutableShadowNode::ensureYogaChildrenAlighment() const {
#ifdef ABI45_0_0REACT_NATIVE_DEBUG
  // If the node is not a leaf node, checking that:
  // - All children are `YogaLayoutableShadowNode` subclasses.
  // - All Yoga children are owned/connected to corresponding children of
  //   this node.

  auto &yogaChildren = yogaNode_.getChildren();
  auto &children = getChildren();

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    ABI45_0_0React_native_assert(yogaChildren.empty());
    return;
  }

  ABI45_0_0React_native_assert(yogaChildren.size() == children.size());

  for (size_t i = 0; i < children.size(); i++) {
    auto &yogaChild = yogaChildren.at(i);
    auto &child = children.at(i);
    ABI45_0_0React_native_assert(
        yogaChild->getContext() ==
        traitCast<YogaLayoutableShadowNode const *>(child.get()));
  }
#endif
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
