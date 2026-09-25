// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct ErrorScreenView: View {
  let content: ErrorScreenContent
  let onRetry: () -> Void
  let onGoHome: () -> Void
  var accountActionTitle: String? = nil
  var onAccountAction: () -> Void = {}

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 16) {
        Text(content.title)
          .font(.system(size: 24, weight: .semibold))

        if let detail = content.detail {
          Text(ErrorScreenText.attributed(detail))
            .font(.system(size: 16))
            .textSelection(.enabled)
        }

        if let fixInstructions = content.fixInstructions {
          VStack(alignment: .leading, spacing: 2) {
            Text("How to fix this error")
              .font(.system(size: 16, weight: .bold))
            Text(ErrorScreenText.attributed(fixInstructions))
              .font(.system(size: 16))
              .textSelection(.enabled)
          }
        }
      }
      .foregroundStyle(Color("textDefault"))
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.horizontal, 16)
      .padding(.top, 24)
    }
    .safeAreaInset(edge: .bottom) {
      VStack(spacing: 8) {
        if let accountActionTitle {
          Button(accountActionTitle, action: onAccountAction)
            .buttonStyle(ErrorScreenButtonStyle(background: Color(red: 0.0, green: 0.46, blue: 1.0), foreground: .white))
        }
        if content.showsRetry {
          Button("Try again", action: onRetry)
            .buttonStyle(ErrorScreenButtonStyle(background: Color("buttonTertiaryBackground"), foreground: Color("buttonTertiaryText")))
        }
        Button("Go home", action: onGoHome)
          .buttonStyle(ErrorScreenButtonStyle(background: Color("buttonSecondaryBackground"), foreground: Color("buttonSecondaryText")))
      }
      .padding(16)
      .background(Color("backgroundDefault"))
    }
    .background(Color("backgroundDefault"))
  }
}
