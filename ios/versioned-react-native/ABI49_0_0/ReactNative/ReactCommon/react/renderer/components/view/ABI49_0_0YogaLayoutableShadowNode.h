/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI49_0_0yoga/ABI49_0_0YGNode.h>

#include <ABI49_0_0React/debug/ABI49_0_0React_native_assert.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/YogaStylableProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutableShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0Sealable.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0DebugStringConvertible.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class YogaLayoutableShadowNode : public LayoutableShadowNode {
  using CompactValue = ABI49_0_0facebook::yoga::detail::CompactValue;

 public:
  using Shared = std::shared_ptr<YogaLayoutableShadowNode const>;
  using ListOfShared =
      butter::small_vector<Shared, kShadowNodeChildrenSmallVectorSize>;

  static ShadowNodeTraits BaseTraits();
  static ShadowNodeTraits::Trait IdentifierTrait();

#pragma mark - Constructors

  YogaLayoutableShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits);

  YogaLayoutableShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment);

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  void appendChild(ShadowNode::Shared const &child) override;
  void replaceChild(
      ShadowNode const &oldChild,
      ShadowNode::Shared const &newChild,
      size_t suggestedIndex = -1) override;

  void updateYogaChildren();

  void updateYogaProps();

  /*
   * Sets layoutable size of node.
   */
  void setSize(Size size) const;

  void setPadding(RectangleEdges<Float> padding) const;

  /*
   * Sets position type of Yoga node (relative, absolute).
   */
  void setPositionType(ABI49_0_0YGPositionType positionType) const;

#pragma mark - LayoutableShadowNode

  void cleanLayout() override;
  void dirtyLayout() override;
  bool getIsLayoutClean() const override;

  /*
   * Computes layout using Yoga layout engine.
   * See `LayoutableShadowNode` for more details.
   */
  void layoutTree(
      LayoutContext layoutContext,
      LayoutConstraints layoutConstraints) override;

  void layout(LayoutContext layoutContext) override;

 protected:
  /*
   * Yoga config associated (only) with this particular node.
   */
  ABI49_0_0YGConfig yogaConfig_;

  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable ABI49_0_0YGNode yogaNode_;

 private:
  /*
   * Goes over `yogaNode_.getChildren()` and in case child's owner is
   * equal to address of `yogaNode_`, it sets child's owner address
   * to `0xBADC0FFEE0DDF00D`. This is magic constant, the intention
   * is to make debugging easier when the address pops up in debugger.
   * This prevents ABA problem where child yoga node goes from owned -> unowned
   * -> back to owned because its parent is allocated at the same address.
   */
  void updateYogaChildrenOwnersIfNeeded();

  /*
   * Return true if child's yogaNode's owner is this->yogaNode_. Otherwise
   * returns false.
   */
  bool doesOwn(YogaLayoutableShadowNode const &child) const;

  /*
   * Appends a Yoga node to the Yoga node associated with this node.
   * The method does *not* do anything besides that (no cloning or `owner` field
   * adjustment).
   */
  void appendYogaChild(YogaLayoutableShadowNode::Shared const &childNode);

  /*
   * Makes the child node with a given `index` (and Yoga node associated with) a
   * valid child node satisfied requirements of the Concurrent Layout approach.
   */
  void adoptYogaChild(size_t index);

  static ABI49_0_0YGConfig &initializeYogaConfig(ABI49_0_0YGConfig &config);
  static ABI49_0_0YGNode *yogaNodeCloneCallbackConnector(
      ABI49_0_0YGNode *oldYogaNode,
      ABI49_0_0YGNode *parentYogaNode,
      int childIndex);
  static ABI49_0_0YGSize yogaNodeMeasureCallbackConnector(
      ABI49_0_0YGNode *yogaNode,
      float width,
      ABI49_0_0YGMeasureMode widthMode,
      float height,
      ABI49_0_0YGMeasureMode heightMode);
  static YogaLayoutableShadowNode &shadowNodeFromContext(ABI49_0_0YGNode *yogaNode);

#pragma mark - RTL Legacy Autoflip

  /*
   * Walks though shadow node hierarchy and reassign following values:
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   * This is neccesarry to be backwards compatible with old renderer, it swaps
   * the values as well in https://fburl.com/diffusion/kl7bjr3h
   */
  static void swapLeftAndRightInTree(
      YogaLayoutableShadowNode const &shadowNode);
  /*
   * In shadow node passed as argument, reassigns following values
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   */
  static void swapLeftAndRightInViewProps(
      YogaLayoutableShadowNode const &shadowNode);
  /*
   * In yoga node passed as argument, reassigns following values
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   */
  static void swapLeftAndRightInYogaStyleProps(
      YogaLayoutableShadowNode const &shadowNode);

  /*
   * Combine a base ABI49_0_0YGStyle with aliased properties which should be flattened
   * into it. E.g. reconciling "marginInlineStart" and "marginStart".
   */
  static ABI49_0_0YGStyle applyAliasedProps(
      const ABI49_0_0YGStyle &baseStyle,
      const YogaStylableProps &props);

#pragma mark - Consistency Ensuring Helpers

  void ensureConsistency() const;
  void ensureYogaChildrenAlignment() const;
  void ensureYogaChildrenOwnersConsistency() const;
  void ensureYogaChildrenLookFine() const;

#pragma mark - Private member variables
  /*
   * List of children which derive from YogaLayoutableShadowNode
   */
  ListOfShared yogaLayoutableChildren_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
