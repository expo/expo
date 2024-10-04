/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI48_0_0yoga/ABI48_0_0YGNode.h>

#include <ABI48_0_0React/ABI48_0_0debug/ABI48_0_0React_native_assert.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/YogaStylableProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutableShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/Sealable.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/DebugStringConvertible.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Geometry.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class YogaLayoutableShadowNode : public LayoutableShadowNode {
 public:
  using UnsharedList = butter::small_vector<
      YogaLayoutableShadowNode *,
      kShadowNodeChildrenSmallVectorSize>;

  static ShadowNodeTraits BaseTraits();

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

  void appendChild(ShadowNode::Shared const &child);

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
  void setPositionType(ABI48_0_0YGPositionType positionType) const;

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
  ABI48_0_0YGConfig yogaConfig_;

  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable ABI48_0_0YGNode yogaNode_;

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
  void appendYogaChild(ShadowNode const &childNode);

  /*
   * Makes the child node with a given `index` (and Yoga node associated with) a
   * valid child node satisfied requirements of the Concurrent Layout approach.
   */
  void adoptYogaChild(size_t index);

  static ABI48_0_0YGConfig &initializeYogaConfig(ABI48_0_0YGConfig &config);
  static ABI48_0_0YGNode *yogaNodeCloneCallbackConnector(
      ABI48_0_0YGNode *oldYogaNode,
      ABI48_0_0YGNode *parentYogaNode,
      int childIndex);
  static ABI48_0_0YGSize yogaNodeMeasureCallbackConnector(
      ABI48_0_0YGNode *yogaNode,
      float width,
      ABI48_0_0YGMeasureMode widthMode,
      float height,
      ABI48_0_0YGMeasureMode heightMode);

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

#pragma mark - Consistency Ensuring Helpers

  void ensureConsistency() const;
  void ensureYogaChildrenAlighment() const;
  void ensureYogaChildrenOwnersConsistency() const;
  void ensureYogaChildrenLookFine() const;
};

template <>
inline YogaLayoutableShadowNode const &
traitCast<YogaLayoutableShadowNode const &>(ShadowNode const &shadowNode) {
  bool castable =
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::YogaLayoutableKind);
  ABI48_0_0React_native_assert(castable);
  (void)castable;
  return static_cast<YogaLayoutableShadowNode const &>(shadowNode);
}

template <>
inline YogaLayoutableShadowNode const *
traitCast<YogaLayoutableShadowNode const *>(ShadowNode const *shadowNode) {
  if (!shadowNode) {
    return nullptr;
  }
  bool castable = shadowNode->getTraits().check(
      ShadowNodeTraits::Trait::YogaLayoutableKind);
  if (!castable) {
    return nullptr;
  }
  return static_cast<YogaLayoutableShadowNode const *>(shadowNode);
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
