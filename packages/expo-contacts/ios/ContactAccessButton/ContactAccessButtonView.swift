// Copyright 2024-present 650 Industries. All rights reserved.

import ContactsUI
import SwiftUI
import ExpoModulesCore

internal struct ExpoContactAccessButton: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject
  internal var props: ContactAccessButtonProps

  var body: some View {
    if #available(iOS 18.0, *) {
      ContactAccessButton(
        queryString: props.query ?? "",
        ignoredEmails: Set(props.ignoredEmails ?? []),
        ignoredPhoneNumbers: Set(props.ignoredPhoneNumbers ?? []),
        approvalCallback: { _ in
          // TODO: Emit an event to JS when it becomes supported on SwiftUI views
        }
      )
      .contactAccessButtonCaption(props.caption?.toContactAccessButtonCaption() ?? .defaultText)
      .padding(.all, props.padding)
      .tint(props.tintColor)
      .let(props.backgroundColor) { view, color in
        view
          .background(color)
          .backgroundStyle(color)
      }
      .let(props.textColor) { view, color in
        view.foregroundStyle(color)
      }
    }
  }
}
