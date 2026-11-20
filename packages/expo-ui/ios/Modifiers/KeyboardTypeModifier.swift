// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

enum KeyboardType: String, Enumerable {
  case defaultKeyboard = "default"
  case emailAddress = "email-address"
  case numeric = "numeric"
  case phonePad = "phone-pad"
  case asciiCapable = "ascii-capable"
  case numbersAndPunctuation = "numbers-and-punctuation"
  case url = "url"
  case namePhonePad = "name-phone-pad"
  case decimalPad = "decimal-pad"
  case twitter = "twitter"
  case webSearch = "web-search"
  case asciiCapableNumberPad = "ascii-capable-number-pad"
}

#if !os(macOS)
func getKeyboardType(_ keyboardType: KeyboardType) -> UIKeyboardType {
  switch keyboardType {
  case .defaultKeyboard:
    return .default
  case .emailAddress:
    return .emailAddress
  case .numeric:
    return .numberPad
  case .phonePad:
    return .phonePad
  case .asciiCapable:
    return .asciiCapable
  case .numbersAndPunctuation:
    return .numbersAndPunctuation
  case .url:
    return .URL
  case .namePhonePad:
    return .namePhonePad
  case .decimalPad:
    return .decimalPad
  case .twitter:
    return .twitter
  case .webSearch:
    return .webSearch
  case .asciiCapableNumberPad:
    return .asciiCapableNumberPad
  }
}
#endif

@MainActor @AnyViewBuilder
internal func keyboardTypeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let keyboardType: KeyboardType? = try p.value("keyboardType", nil)
#if os(macOS)
  content
#else
  if let keyboardType {
    content.keyboardType(getKeyboardType(keyboardType))
  } else {
    content
  }
#endif
}

@MainActor @AnyViewBuilder
internal func autocorrectionDisabledModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let disabled: Bool = try p.value("disabled", true)
  content.autocorrectionDisabled(disabled)
}
