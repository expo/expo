/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cmath>
#include <memory>
#include <vector>

#include <ABI49_0_0butter/ABI49_0_0small_vector.h>
#include <ABI49_0_0React/debug/ABI49_0_0React_native_assert.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutMetrics.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNodeFragment.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0DebugStringConvertible.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Transform.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

struct LayoutConstraints;
struct LayoutContext;

/*
 * Describes all sufficient layout API (in approach-agnostic way)
 * which makes a concurrent layout possible.
 */
class LayoutableShadowNode : public ShadowNode {
 public:
  LayoutableShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits);

  LayoutableShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment);

  static ShadowNodeTraits BaseTraits();
  static ShadowNodeTraits::Trait IdentifierTrait();

  struct LayoutInspectingPolicy {
    bool includeTransform{true};
    bool includeViewportOffset{false};
  };

  using UnsharedList = butter::
      small_vector<LayoutableShadowNode *, kShadowNodeChildrenSmallVectorSize>;

  /*
   * Returns layout metrics of a node represented as `descendantNodeFamily`
   * computed relatively to given `ancestorNode`. Returns `EmptyLayoutMetrics`
   * if the nodes don't form an ancestor-descender relationship in the same
   * tree.
   */
  static LayoutMetrics computeRelativeLayoutMetrics(
      ShadowNodeFamily const &descendantNodeFamily,
      LayoutableShadowNode const &ancestorNode,
      LayoutInspectingPolicy policy);

  /*
   * Performs layout of the tree starting from this node. Usually is being
   * called on the root node.
   * Default implementation does nothing.
   */
  virtual void layoutTree(
      LayoutContext layoutContext,
      LayoutConstraints layoutConstraints) = 0;

  /*
   * Measures the node (and node content, probably recursively) with
   * given constrains and relying on possible layout.
   * Default implementation returns zero size.
   */
  virtual Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const;

  /*
   * Measures the node with given `layoutContext` and `layoutConstraints`.
   * The size of nested content and the padding should be included, the margin
   * should *not* be included. Default implementation returns zero size.
   */
  virtual Size measure(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const;

  /*
   * Computes layout recursively.
   * Additional environmental constraints might be provided via `layoutContext`
   * argument.
   *
   * The typical concrete-layout-specific implementation of this method should:
   * - Measure children with `LayoutConstraints` calculated from its size using
   *   a particular layout approach;
   * - Calculate and assign `LayoutMetrics` for the children;
   * - Call itself recursively on every child if needed.
   */
  virtual void layout(LayoutContext layoutContext) = 0;

  /*
   * Returns layout metrics computed during previous layout pass.
   */
  LayoutMetrics getLayoutMetrics() const;

  /*
   * Returns a transform object that represents transformations that will/should
   * be applied on top of regular layout metrics by mounting layer.
   * The `transform` value modifies a coordinate space of a layout system.
   * Default implementation returns `Identity` transform.
   */
  virtual Transform getTransform() const;

  /*
   * Returns offset which is applied to children's origin in
   * `LayoutableShadowNode::getRelativeLayoutMetrics` and
   * `LayoutableShadowNode::findNodeAtPoint`.
   */
  virtual Point getContentOriginOffset() const;

  /*
   * Sets layout metrics for the shadow node.
   */
  void setLayoutMetrics(LayoutMetrics layoutMetrics);

  /*
   * Returns the ShadowNode that is rendered at the Point received as a
   * parameter.
   */
  static ShadowNode::Shared findNodeAtPoint(
      ShadowNode::Shared const &node,
      Point point);

  /*
   * Clean or Dirty layout state:
   * Indicates whether all nodes (and possibly their subtrees) along the path
   * to the root node should be re-laid out.
   */
  virtual void cleanLayout() = 0;
  virtual void dirtyLayout() = 0;
  virtual bool getIsLayoutClean() const = 0;

  /*
   * Unifed methods to access text layout metrics.
   */
  virtual Float firstBaseline(Size size) const;
  virtual Float lastBaseline(Size size) const;

  /*
   * Returns layoutable children to iterate on.
   */
  LayoutableShadowNode::UnsharedList getLayoutableChildNodes() const;

#pragma mark - DebugStringConvertible

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif

  LayoutMetrics layoutMetrics_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
