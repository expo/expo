/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI42_0_0React/components/view/AccessibilityPrimitives.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

inline void fromString(const std::string &string, AccessibilityTraits &result) {
  if (string == "none") {
    result = AccessibilityTraits::None;
    return;
  }
  if (string == "button") {
    result = AccessibilityTraits::Button;
    return;
  }
  if (string == "link") {
    result = AccessibilityTraits::Link;
    return;
  }
  if (string == "image") {
    result = AccessibilityTraits::Image;
    return;
  }
  if (string == "selected") {
    result = AccessibilityTraits::Selected;
    return;
  }
  if (string == "plays") {
    result = AccessibilityTraits::PlaysSound;
    return;
  }
  if (string == "keyboardkey" || string == "key") {
    result = AccessibilityTraits::KeyboardKey;
    return;
  }
  if (string == "text") {
    result = AccessibilityTraits::StaticText;
    return;
  }
  if (string == "disabled") {
    result = AccessibilityTraits::NotEnabled;
    return;
  }
  if (string == "frequentUpdates") {
    result = AccessibilityTraits::UpdatesFrequently;
    return;
  }
  if (string == "search") {
    result = AccessibilityTraits::SearchField;
    return;
  }
  if (string == "startsMedia") {
    result = AccessibilityTraits::StartsMediaSession;
    return;
  }
  if (string == "adjustable") {
    result = AccessibilityTraits::Adjustable;
    return;
  }
  if (string == "allowsDirectInteraction") {
    result = AccessibilityTraits::AllowsDirectInteraction;
    return;
  }
  if (string == "pageTurn") {
    result = AccessibilityTraits::CausesPageTurn;
    return;
  }
  if (string == "header") {
    result = AccessibilityTraits::Header;
    return;
  }
  if (string == "imagebutton") {
    result = AccessibilityTraits::Image | AccessibilityTraits::Button;
    return;
  }
  if (string == "summary") {
    result = AccessibilityTraits::SummaryElement;
    return;
  }

  result = AccessibilityTraits::None;
}

inline void fromRawValue(const RawValue &value, AccessibilityTraits &result) {
  if (value.hasType<std::string>()) {
    fromString((std::string)value, result);
    return;
  }

  if (value.hasType<std::vector<std::string>>()) {
    result = {};
    auto items = (std::vector<std::string>)value;
    for (auto &item : items) {
      AccessibilityTraits itemAccessibilityTraits;
      fromString(item, itemAccessibilityTraits);
      result = result | itemAccessibilityTraits;
    }
  }

  abort();
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
