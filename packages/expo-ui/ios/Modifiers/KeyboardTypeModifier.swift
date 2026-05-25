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

internal struct KeyboardTypeModifier: ViewModifier, Record {
  @Field var keyboardType: KeyboardType?

  func body(content: Content) -> some View {
    if let keyboardType {
      content.keyboardType(getKeyboardType(keyboardType))
    } else {
      content
    }
  }
}

internal struct AutocorrectionDisabledModifier: ViewModifier, Record {
  @Field var disabled: Bool = true

  func body(content: Content) -> some View {
    content.autocorrectionDisabled(disabled)
  }
}
