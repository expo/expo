/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/view/AccessibleShadowNode.h>
#include <ReactABI34_0_0/components/view/ViewEventEmitter.h>
#include <ReactABI34_0_0/components/view/ViewProps.h>
#include <ReactABI34_0_0/components/view/YogaLayoutableShadowNode.h>
#include <ReactABI34_0_0/core/ConcreteShadowNode.h>
#include <ReactABI34_0_0/core/LayoutableShadowNode.h>
#include <ReactABI34_0_0/core/ShadowNode.h>
#include <ReactABI34_0_0/core/ShadowNodeFragment.h>
#include <ReactABI34_0_0/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Template for all <View>-like classes (classes which have all same props
 * as <View> and similar basic behaviour).
 * For example: <Paragraph>, <Image>, but not <Text>, <RawText>.
 */
template <
    const char *concreteComponentName,
    typename ViewPropsT = ViewProps,
    typename ViewEventEmitterT = ViewEventEmitter>
class ConcreteViewShadowNode : public ConcreteShadowNode<
                                   concreteComponentName,
                                   ViewPropsT,
                                   ViewEventEmitterT>,
                               public AccessibleShadowNode,
                               public YogaLayoutableShadowNode {
  static_assert(
      std::is_base_of<ViewProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of ViewProps");
  static_assert(
      std::is_base_of<YogaStylableProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of YogaStylableProps");
  static_assert(
      std::is_base_of<AccessibilityProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of AccessibilityProps");

 public:
  using BaseShadowNode =
      ConcreteShadowNode<concreteComponentName, ViewPropsT, ViewEventEmitterT>;
  using ConcreteViewProps = ViewPropsT;

  ConcreteViewShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeCloneFunction &cloneFunction)
      : BaseShadowNode(fragment, cloneFunction),
        AccessibleShadowNode(
            std::static_pointer_cast<const ConcreteViewProps>(fragment.props)),
        YogaLayoutableShadowNode() {
    YogaLayoutableShadowNode::setProps(
        *std::static_pointer_cast<const ConcreteViewProps>(fragment.props));
    YogaLayoutableShadowNode::setChildren(
        BaseShadowNode::template getChildrenSlice<YogaLayoutableShadowNode>());
  };

  ConcreteViewShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment)
      : BaseShadowNode(sourceShadowNode, fragment),
        AccessibleShadowNode(
            static_cast<const ConcreteViewShadowNode &>(sourceShadowNode),
            std::static_pointer_cast<const ConcreteViewProps>(fragment.props)),
        YogaLayoutableShadowNode(
            static_cast<const ConcreteViewShadowNode &>(sourceShadowNode)) {
    if (fragment.props) {
      YogaLayoutableShadowNode::setProps(
          *std::static_pointer_cast<const ConcreteViewProps>(fragment.props));
    }

    if (fragment.children) {
      YogaLayoutableShadowNode::setChildren(
          BaseShadowNode::template getChildrenSlice<
              YogaLayoutableShadowNode>());
    }
  };

  void appendChild(const SharedShadowNode &child) {
    ensureUnsealed();

    ShadowNode::appendChild(child);

    auto nonConstChild = const_cast<ShadowNode *>(child.get());
    auto ABI34_0_0yogaLayoutableChild =
        dynamic_cast<YogaLayoutableShadowNode *>(nonConstChild);
    if (ABI34_0_0yogaLayoutableChild) {
      YogaLayoutableShadowNode::appendChild(ABI34_0_0yogaLayoutableChild);
    }
  }

  LayoutableShadowNode *cloneAndReplaceChild(
      LayoutableShadowNode *child,
      int suggestedIndex = -1) override {
    ensureUnsealed();
    auto childShadowNode = static_cast<const ConcreteViewShadowNode *>(child);
    auto clonedChildShadowNode =
        std::static_pointer_cast<ConcreteViewShadowNode>(
            childShadowNode->clone({}));
    ShadowNode::replaceChild(
        childShadowNode->shared_from_this(),
        clonedChildShadowNode,
        suggestedIndex);
    return clonedChildShadowNode.get();
  }

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override {
    auto list = SharedDebugStringConvertibleList{};

    auto basePropsList = ShadowNode::getDebugProps();
    std::move(
        basePropsList.begin(), basePropsList.end(), std::back_inserter(list));

    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "layout", "", LayoutableShadowNode::getDebugProps()));

    return list;
  }
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
