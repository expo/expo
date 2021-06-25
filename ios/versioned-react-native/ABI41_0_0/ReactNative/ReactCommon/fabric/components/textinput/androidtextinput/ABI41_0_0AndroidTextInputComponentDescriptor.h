/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/core/ConcreteComponentDescriptor.h>
#include "ABI41_0_0AndroidTextInputShadowNode.h"

#include <ABI41_0_0yoga/ABI41_0_0CompactValue.h>
#include <ABI41_0_0yoga/ABI41_0_0YGEnums.h>
#include <ABI41_0_0yoga/ABI41_0_0YGValue.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Descriptor for <AndroidTextInput> component.
 */
class AndroidTextInputComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidTextInputShadowNode> {
 public:
  AndroidTextInputComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<AndroidTextInputShadowNode>(parameters) {
    // Every single `AndroidTextInputShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer_);
  }

  virtual State::Shared createInitialState(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family) const override {
    int surfaceId = family->getSurfaceId();

    float defaultThemePaddingStart = NAN;
    float defaultThemePaddingEnd = NAN;
    float defaultThemePaddingTop = NAN;
    float defaultThemePaddingBottom = NAN;

    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      ABI41_0_0YGStyle::Edges theme = surfaceIdToThemePaddingMap_[surfaceId];
      defaultThemePaddingStart = ((ABI41_0_0YGValue)theme[ABI41_0_0YGEdgeStart]).value;
      defaultThemePaddingEnd = ((ABI41_0_0YGValue)theme[ABI41_0_0YGEdgeEnd]).value;
      defaultThemePaddingTop = ((ABI41_0_0YGValue)theme[ABI41_0_0YGEdgeTop]).value;
      defaultThemePaddingBottom = ((ABI41_0_0YGValue)theme[ABI41_0_0YGEdgeBottom]).value;
    }

    return std::make_shared<AndroidTextInputShadowNode::ConcreteState>(
        std::make_shared<AndroidTextInputState const>(AndroidTextInputState(
            0,
            {},
            {},
            {},
            {},
            {},
            textLayoutManager_,
            defaultThemePaddingStart,
            defaultThemePaddingEnd,
            defaultThemePaddingTop,
            defaultThemePaddingBottom)),
        family);
  }

 protected:
  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<AndroidTextInputShadowNode>(shadowNode));
    auto textInputShadowNode =
        std::static_pointer_cast<AndroidTextInputShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    textInputShadowNode->setTextLayoutManager(textLayoutManager_);

    textInputShadowNode->setContextContainer(
        const_cast<ContextContainer *>(getContextContainer().get()));

    // Get theme padding from cache, or set it from State.
    // In theory, the Java ViewManager for TextInput should need to set state
    // *exactly once* per surface to communicate the correct default padding,
    // which will be cached here in C++.
    // TODO T63008435: can this feature be removed entirely?
    // TODO: figure out RTL/start/end/left/right stuff here
    int surfaceId = textInputShadowNode->getSurfaceId();
    const AndroidTextInputState &state = textInputShadowNode->getStateData();
    if (surfaceIdToThemePaddingMap_.find(surfaceId) ==
            surfaceIdToThemePaddingMap_.end() &&
        !isnan(state.defaultThemePaddingStart)) {
      ABI41_0_0YGStyle::Edges result;
      result[ABI41_0_0YGEdgeStart] =
          (ABI41_0_0YGValue){state.defaultThemePaddingStart, ABI41_0_0YGUnitPoint};
      result[ABI41_0_0YGEdgeEnd] = (ABI41_0_0YGValue){state.defaultThemePaddingEnd, ABI41_0_0YGUnitPoint};
      result[ABI41_0_0YGEdgeTop] = (ABI41_0_0YGValue){state.defaultThemePaddingTop, ABI41_0_0YGUnitPoint};
      result[ABI41_0_0YGEdgeBottom] =
          (ABI41_0_0YGValue){state.defaultThemePaddingBottom, ABI41_0_0YGUnitPoint};
      surfaceIdToThemePaddingMap_.emplace(std::make_pair(surfaceId, result));
    }

    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      ABI41_0_0YGStyle::Edges theme = surfaceIdToThemePaddingMap_[surfaceId];

      // Override padding
      // Node is still unsealed during adoption, before layout is complete
      // TODO: T62959168 account for RTL and paddingLeft when setting default
      // paddingStart, and vice-versa with paddingRight/paddingEnd.
      // For now this assumes no RTL.
      ABI41_0_0YGStyle::Edges result =
          textInputShadowNode->getConcreteProps().yogaStyle.padding();
      bool changedPadding = false;
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingStart &&
          !textInputShadowNode->getConcreteProps().hasPaddingLeft &&
          !textInputShadowNode->getConcreteProps().hasPaddingHorizontal) {
        changedPadding = true;
        result[ABI41_0_0YGEdgeStart] = theme[ABI41_0_0YGEdgeStart];
      }
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingEnd &&
          !textInputShadowNode->getConcreteProps().hasPaddingRight &&
          !textInputShadowNode->getConcreteProps().hasPaddingHorizontal) {
        changedPadding = true;
        result[ABI41_0_0YGEdgeEnd] = theme[ABI41_0_0YGEdgeEnd];
      }
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingTop &&
          !textInputShadowNode->getConcreteProps().hasPaddingVertical) {
        changedPadding = true;
        result[ABI41_0_0YGEdgeTop] = theme[ABI41_0_0YGEdgeTop];
      }
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingBottom &&
          !textInputShadowNode->getConcreteProps().hasPaddingVertical) {
        changedPadding = true;
        result[ABI41_0_0YGEdgeBottom] = theme[ABI41_0_0YGEdgeBottom];
      }

      // If the TextInput initially does not have paddingLeft or paddingStart, a
      // paddingStart may be set from the theme. If that happens, when there's a
      // paddingLeft update, we must explicitly unset paddingStart... (same with
      // paddingEnd)
      // TODO: support RTL
      if ((textInputShadowNode->getConcreteProps().hasPadding ||
           textInputShadowNode->getConcreteProps().hasPaddingLeft ||
           textInputShadowNode->getConcreteProps().hasPaddingHorizontal) &&
          !textInputShadowNode->getConcreteProps().hasPaddingStart) {
        result[ABI41_0_0YGEdgeStart] = ABI41_0_0YGValueUndefined;
      }
      if ((textInputShadowNode->getConcreteProps().hasPadding ||
           textInputShadowNode->getConcreteProps().hasPaddingRight ||
           textInputShadowNode->getConcreteProps().hasPaddingHorizontal) &&
          !textInputShadowNode->getConcreteProps().hasPaddingEnd) {
        result[ABI41_0_0YGEdgeEnd] = ABI41_0_0YGValueUndefined;
      }

      // Note that this is expensive: on every adopt, we need to set the Yoga
      // props again, which normally only happens during prop parsing. Every
      // commit, state update, etc, will incur this cost.
      if (changedPadding) {
        // Set new props on node
        const_cast<AndroidTextInputProps &>(
            textInputShadowNode->getConcreteProps())
            .yogaStyle.padding() = result;
        // Communicate new props to Yoga part of the node
        textInputShadowNode->updateYogaProps();
      }
    }

    textInputShadowNode->dirtyLayout();
    textInputShadowNode->enableMeasurement();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
  mutable better::map<int, ABI41_0_0YGStyle::Edges> surfaceIdToThemePaddingMap_;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
