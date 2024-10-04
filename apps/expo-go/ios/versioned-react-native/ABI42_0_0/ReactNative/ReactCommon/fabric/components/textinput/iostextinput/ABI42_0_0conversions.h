/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/components/iostextinput/primitives.h>
#include <ABI42_0_0React/core/propsConversions.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

inline void fromRawValue(
    const RawValue &value,
    AutocapitalizationType &result) {
  auto string = (std::string)value;
  if (string == "none") {
    result = AutocapitalizationType::None;
    return;
  }
  if (string == "words") {
    result = AutocapitalizationType::Words;
    return;
  }
  if (string == "sentences") {
    result = AutocapitalizationType::Sentences;
    return;
  }
  if (string == "characters") {
    result = AutocapitalizationType::Characters;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, KeyboardAppearance &result) {
  auto string = (std::string)value;
  if (string == "default") {
    result = KeyboardAppearance::Default;
    return;
  }
  if (string == "light") {
    result = KeyboardAppearance::Light;
    return;
  }
  if (string == "dark") {
    result = KeyboardAppearance::Dark;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ReturnKeyType &result) {
  auto string = (std::string)value;
  if (string == "default") {
    result = ReturnKeyType::Default;
    return;
  }
  if (string == "done") {
    result = ReturnKeyType::Done;
    return;
  }
  if (string == "go") {
    result = ReturnKeyType::Go;
    return;
  }
  if (string == "next") {
    result = ReturnKeyType::Next;
    return;
  }
  if (string == "search") {
    result = ReturnKeyType::Search;
    return;
  }
  if (string == "send") {
    result = ReturnKeyType::Send;
    return;
  }

  // Android-only
  if (string == "none") {
    result = ReturnKeyType::None;
    return;
  }
  if (string == "previous") {
    result = ReturnKeyType::Previous;
    return;
  }

  // iOS-only
  if (string == "emergency-call") {
    result = ReturnKeyType::EmergencyCall;
    return;
  }
  if (string == "google") {
    result = ReturnKeyType::Google;
    return;
  }
  if (string == "join") {
    result = ReturnKeyType::Join;
    return;
  }
  if (string == "route") {
    result = ReturnKeyType::Route;
    return;
  }
  if (string == "yahoo") {
    result = ReturnKeyType::Yahoo;
    return;
  }
  if (string == "continue") {
    result = ReturnKeyType::Continue;
    return;
  }
  abort();
}

inline void fromRawValue(
    const RawValue &value,
    TextInputAccessoryVisibilityMode &result) {
  auto string = (std::string)value;
  if (string == "never") {
    result = TextInputAccessoryVisibilityMode::Never;
    return;
  }
  if (string == "while-editing") {
    result = TextInputAccessoryVisibilityMode::WhileEditing;
    return;
  }
  if (string == "unless-editing") {
    result = TextInputAccessoryVisibilityMode::UnlessEditing;
    return;
  }
  if (string == "always") {
    result = TextInputAccessoryVisibilityMode::Always;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, KeyboardType &result) {
  auto string = (std::string)value;
  if (string == "default") {
    result = KeyboardType::Default;
    return;
  }
  if (string == "email-address") {
    result = KeyboardType::EmailAddress;
    return;
  }
  if (string == "numeric") {
    result = KeyboardType::Numeric;
    return;
  }
  if (string == "phone-pad") {
    result = KeyboardType::PhonePad;
    return;
  }
  if (string == "number-pad") {
    result = KeyboardType::NumberPad;
    return;
  }
  if (string == "decimal-pad") {
    result = KeyboardType::DecimalPad;
    return;
  }

  // iOS-only
  if (string == "ascii-capable") {
    result = KeyboardType::ASCIICapable;
    return;
  }
  if (string == "numbers-and-punctuation") {
    result = KeyboardType::NumbersAndPunctuation;
    return;
  }
  if (string == "url") {
    result = KeyboardType::URL;
    return;
  }
  if (string == "name-phone-pad") {
    result = KeyboardType::NamePhonePad;
    return;
  }
  if (string == "twitter") {
    result = KeyboardType::Twitter;
    return;
  }
  if (string == "web-search") {
    result = KeyboardType::WebSearch;
    return;
  }
  if (string == "ascii-capable-number-pad") {
    result = KeyboardType::ASCIICapableNumberPad;
    return;
  }

  // Android-only
  if (string == "visible-password") {
    result = KeyboardType::VisiblePassword;
    return;
  }
  abort();
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
