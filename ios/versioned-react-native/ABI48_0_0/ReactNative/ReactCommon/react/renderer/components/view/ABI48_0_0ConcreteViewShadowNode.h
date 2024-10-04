/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewEventEmitter.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/YogaLayoutableShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutableShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNodeFragment.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/DebugStringConvertibleItem.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Template for all <View>-like classes (classes which have all same props
 * as <View> and similar basic behaviour).
 * For example: <Paragraph>, <Image>, but not <Text>, <RawText>.
 */
template <
    const char *concreteComponentName,
    typename ViewPropsT = ViewProps,
    typename ViewEventEmitterT = ViewEventEmitter,
    typename... Ts>
class ConcreteViewShadowNode : public ConcreteShadowNode<
                                   concreteComponentName,
                                   YogaLayoutableShadowNode,
                                   ViewPropsT,
                                   ViewEventEmitterT,
                                   Ts...> {
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
  using BaseShadowNode = ConcreteShadowNode<
      concreteComponentName,
      YogaLayoutableShadowNode,
      ViewPropsT,
      ViewEventEmitterT,
      Ts...>;

  ConcreteViewShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, family, traits) {
    initialize();
  }

  ConcreteViewShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment)
      : BaseShadowNode(sourceShadowNode, fragment) {
    initialize();
  }

  using ConcreteViewProps = ViewPropsT;

  using BaseShadowNode::BaseShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = BaseShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::ViewKind);
    traits.set(ShadowNodeTraits::Trait::FormsStackingContext);
    traits.set(ShadowNodeTraits::Trait::FormsView);
    return traits;
  }

  Transform getTransform() const override {
    return BaseShadowNode::getConcreteProps().transform;
  }

#pragma mark - DebugStringConvertible

#if ABI48_0_0RN_DEBUG_STRING_CONVERTIBLE
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

 private:
  void initialize() noexcept {
    auto &props = BaseShadowNode::getConcreteProps();

    if (props.yogaStyle.display() == ABI48_0_0YGDisplayNone) {
      BaseShadowNode::traits_.set(ShadowNodeTraits::Trait::Hidden);
    } else {
      BaseShadowNode::traits_.unset(ShadowNodeTraits::Trait::Hidden);
    }

    // `zIndex` is only defined for non-`static` positioned views.
    if (props.yogaStyle.positionType() != ABI48_0_0YGPositionTypeStatic) {
      BaseShadowNode::orderIndex_ = props.zIndex.value_or(0);
    } else {
      BaseShadowNode::orderIndex_ = 0;
    }
  }
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
