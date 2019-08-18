/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI31_0_0yoga/ABI31_0_0YGNode.h>

#include <ABI31_0_0fabric/ABI31_0_0components/view/YogaStylableProps.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutableShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0core/Sealable.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI31_0_0 {

class YogaLayoutableShadowNode:
  public LayoutableShadowNode,
  public virtual DebugStringConvertible,
  public virtual Sealable {

public:

#pragma mark - Constructors

  YogaLayoutableShadowNode();

  YogaLayoutableShadowNode(const YogaLayoutableShadowNode &layoutableShadowNode);

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  /*
   * Appends `child`'s Yoga node to the own Yoga node.
   * Complements `ShadowNode::appendChild(...)` functionality from Yoga perspective.
   */
  void appendChild(YogaLayoutableShadowNode *child);

  /*
   * Sets Yoga children based on collection of `YogaLayoutableShadowNode` instances.
   * Complements `ShadowNode::setChildren(...)` functionality from Yoga perspective.
   */
  void setChildren(std::vector<YogaLayoutableShadowNode *> children);

  /*
   * Sets Yoga styles based on given `YogaStylableProps`.
   */
  void setProps(const YogaStylableProps &props);

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

  std::vector<LayoutableShadowNode *> getLayoutableChildNodes() const override;

protected:
  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable ABI31_0_0YGNode yogaNode_;

  /*
   * Yoga config associated (only) with this particular node.
   */
  ABI31_0_0YGConfig yogaConfig_;

private:
  static void initializeYogaConfig(ABI31_0_0YGConfig &config);
  static ABI31_0_0YGNode *yogaNodeCloneCallbackConnector(ABI31_0_0YGNode *oldYogaNode, ABI31_0_0YGNode *parentYogaNode, int childIndex);
  static ABI31_0_0YGSize yogaNodeMeasureCallbackConnector(ABI31_0_0YGNode *yogaNode, float width, ABI31_0_0YGMeasureMode widthMode, float height, ABI31_0_0YGMeasureMode heightMode);
};

} // namespace ReactABI31_0_0
} // namespace facebook
