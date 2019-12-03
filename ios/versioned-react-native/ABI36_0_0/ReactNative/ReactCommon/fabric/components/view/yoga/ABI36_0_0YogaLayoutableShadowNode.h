/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI36_0_0yoga/ABI36_0_0YGNode.h>

#include <ABI36_0_0React/components/view/YogaStylableProps.h>
#include <ABI36_0_0React/core/LayoutableShadowNode.h>
#include <ABI36_0_0React/core/Sealable.h>
#include <ABI36_0_0React/core/ShadowNode.h>
#include <ABI36_0_0React/debug/DebugStringConvertible.h>
#include <ABI36_0_0React/graphics/Geometry.h>

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

class YogaLayoutableShadowNode : public LayoutableShadowNode,
                                 public virtual DebugStringConvertible,
                                 public virtual Sealable {
 public:
  using UnsharedList = better::small_vector<
      YogaLayoutableShadowNode *,
      kShadowNodeChildrenSmallVectorSize>;

#pragma mark - Constructors

  YogaLayoutableShadowNode();

  YogaLayoutableShadowNode(
      const YogaLayoutableShadowNode &layoutableShadowNode);

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  /*
   * Appends `child`'s Yoga node to the own Yoga node.
   * Complements `ShadowNode::appendChild(...)` functionality from Yoga
   * perspective.
   */
  void appendChild(YogaLayoutableShadowNode *child);

  /*
   * Sets Yoga children based on collection of `YogaLayoutableShadowNode`
   * instances. Complements `ShadowNode::setChildren(...)` functionality from
   * Yoga perspective.
   */
  void setChildren(YogaLayoutableShadowNode::UnsharedList children);

  /*
   * Sets Yoga styles based on given `YogaStylableProps`.
   */
  void setProps(const YogaStylableProps &props);

  /**
   * Sets layoutable size of node.
   */
  void setSize(Size size) const;

  /**
   * Sets position type of Yoga node (relative, absolute).
   */
  void setPositionType(ABI36_0_0YGPositionType positionType) const;

#pragma mark - LayoutableShadowNode

  void cleanLayout() override;
  void dirtyLayout() override;
  bool getIsLayoutClean() const override;

  void setHasNewLayout(bool hasNewLayout) override;
  bool getHasNewLayout() const override;

  /*
   * Computes layout using Yoga layout engine.
   * See `LayoutableShadowNode` for more details.
   */
  void layout(LayoutContext layoutContext) override;

  void layoutChildren(LayoutContext layoutContext) override;

  LayoutableShadowNode::UnsharedList getLayoutableChildNodes() const override;

 protected:
  /*
   * Yoga config associated (only) with this particular node.
   */
  ABI36_0_0YGConfig yogaConfig_;

  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable ABI36_0_0YGNode yogaNode_;

 private:
  static ABI36_0_0YGConfig &initializeYogaConfig(ABI36_0_0YGConfig &config);
  static ABI36_0_0YGNode *yogaNodeCloneCallbackConnector(
      ABI36_0_0YGNode *oldYogaNode,
      ABI36_0_0YGNode *parentYogaNode,
      int childIndex);
  static ABI36_0_0YGSize yogaNodeMeasureCallbackConnector(
      ABI36_0_0YGNode *yogaNode,
      float width,
      ABI36_0_0YGMeasureMode widthMode,
      float height,
      ABI36_0_0YGMeasureMode heightMode);
};

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
