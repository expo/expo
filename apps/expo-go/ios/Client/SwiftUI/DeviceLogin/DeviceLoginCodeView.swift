// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct DeviceLoginCodeView: View {
  let userCode: String
  let origin: String

  var body: some View {
    VStack(alignment: .leading, spacing: 24) {
      VStack(alignment: .leading, spacing: 8) {
        Text("Your code")
          .font(.headline)
        Text(userCode)
          .font(.system(size: 34, weight: .bold, design: .monospaced))
          .textSelection(.enabled)
          .accessibilityLabel(spelledOut(userCode))
      }

      VStack(alignment: .leading, spacing: 8) {
        Text("Enter it on the page that showed you the QR code:")
          .font(.subheadline)
          .foregroundColor(.secondary)
        // Plain text on purpose. This address comes from a scanned QR code, so Expo Go never opens it.
        Text(origin)
          .font(.system(.body, design: .monospaced))
          .foregroundColor(.primary)
      }

      Button {
        UIPasteboard.general.string = userCode
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
      } label: {
        Text("Copy code")
          .font(.headline)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
      }
      .background(Color.expoSystemBackground)
      .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.secondary.opacity(0.3)))
      .cornerRadius(12)

      HStack(spacing: 8) {
        ProgressView()
        Text("Waiting for you to approve this sign-in")
          .font(.subheadline)
          .foregroundColor(.secondary)
      }

      Text("This code stops working after 10 minutes.")
        .font(.footnote)
        .foregroundColor(.secondary)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  /// VoiceOver reads "BCDFGHJK" as a word. Spelling it out makes it transcribable.
  private func spelledOut(_ code: String) -> String {
    code.map { $0 == "-" ? "dash" : String($0) }.joined(separator: " ")
  }
}
