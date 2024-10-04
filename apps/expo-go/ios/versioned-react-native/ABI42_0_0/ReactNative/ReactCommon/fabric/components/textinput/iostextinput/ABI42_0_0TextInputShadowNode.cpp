/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0TextInputShadowNode.h"

#include <ABI42_0_0React/attributedstring/AttributedStringBox.h>
#include <ABI42_0_0React/attributedstring/TextAttributes.h>
#include <ABI42_0_0React/core/LayoutConstraints.h>
#include <ABI42_0_0React/core/LayoutContext.h>
#include <ABI42_0_0React/core/conversions.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

extern char const TextInputComponentName[] = "TextInput";

AttributedStringBox TextInputShadowNode::attributedStringBoxToMeasure() const {
  bool hasMeaningfulState =
      getState() && getState()->getRevision() != State::initialRevisionValue;

  if (hasMeaningfulState) {
    auto attributedStringBox = getStateData().attributedStringBox;
    if (attributedStringBox.getMode() ==
            AttributedStringBox::Mode::OpaquePointer ||
        !attributedStringBox.getValue().isEmpty()) {
      return getStateData().attributedStringBox;
    }
  }

  auto attributedString =
      hasMeaningfulState ? AttributedString{} : getAttributedString();

  if (attributedString.isEmpty()) {
    auto placeholder = getConcreteProps().placeholder;
    // Note: `zero-width space` is insufficient in some cases (e.g. when we need
    // to measure the "hight" of the font).
    auto string = !placeholder.empty() ? placeholder : "I";
    auto textAttributes = getConcreteProps().getEffectiveTextAttributes();
    attributedString.appendFragment({string, textAttributes, {}});
  }

  return AttributedStringBox{attributedString};
}

AttributedString TextInputShadowNode::getAttributedString() const {
  auto textAttributes = getConcreteProps().getEffectiveTextAttributes();
  auto attributedString = AttributedString{};

  attributedString.appendFragment(
      AttributedString::Fragment{getConcreteProps().text, textAttributes});

  auto attachments = Attachments{};
  BaseTextShadowNode::buildAttributedString(
      textAttributes, *this, attributedString, attachments);

  return attributedString;
}

void TextInputShadowNode::setTextLayoutManager(
    TextLayoutManager::Shared const &textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void TextInputShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto ABI42_0_0ReactTreeAttributedString = getAttributedString();
  auto const &state = getStateData();

  assert(textLayoutManager_);
  assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.ABI42_0_0ReactTreeAttributedString == ABI42_0_0ReactTreeAttributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  auto newState = TextInputState{};
  newState.attributedStringBox = AttributedStringBox{ABI42_0_0ReactTreeAttributedString};
  newState.paragraphAttributes = getConcreteProps().paragraphAttributes;
  newState.ABI42_0_0ReactTreeAttributedString = ABI42_0_0ReactTreeAttributedString;
  newState.layoutManager = textLayoutManager_;
  newState.mostRecentEventCount = getConcreteProps().mostRecentEventCount;
  setStateData(std::move(newState));
}

#pragma mark - LayoutableShadowNode

Size TextInputShadowNode::measure(LayoutConstraints layoutConstraints) const {
  return textLayoutManager_
      ->measure(
          attributedStringBoxToMeasure(),
          getConcreteProps().getEffectiveParagraphAttributes(),
          layoutConstraints)
      .size;
}

void TextInputShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
