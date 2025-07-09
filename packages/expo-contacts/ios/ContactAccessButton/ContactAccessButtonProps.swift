// Copyright 2024-present 650 Industries. All rights reserved.

import ContactsUI
import SwiftUI
import ExpoModulesCore

internal final class ContactAccessButtonProps: ExpoSwiftUI.ViewProps {
  @Field
  var query: String?

  @Field
  var caption: Caption?

  @Field
  var ignoredEmails: [String]?

  @Field
  var ignoredPhoneNumbers: [String]?

  // MARK: - Styles

  @Field
  var tintColor: Color?

  @Field
  var backgroundColor: Color?

  @Field
  var textColor: Color?

  @Field
  var padding: CGFloat?
}

internal enum Caption: String, Enumerable {
  case `default`
  case email
  case phone

  @available(iOS 18.0, *)
  func toContactAccessButtonCaption() -> ContactAccessButton.Caption {
    switch self {
    case .default:
      return .defaultText
    case .email:
      return .email
    case .phone:
      return .phone
    }
  }
}
