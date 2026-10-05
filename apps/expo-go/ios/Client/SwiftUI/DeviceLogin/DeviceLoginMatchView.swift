// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct DeviceLoginMatchView: View {
  let options: [String]
  let onPick: (String) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 24) {
      VStack(alignment: .leading, spacing: 8) {
        Text("Tap the number shown on your other screen")
          .font(.headline)
        Text("You only get one try. A wrong number cancels this attempt, and you will need a new code.")
          .font(.subheadline)
          .foregroundColor(.secondary)
      }

      VStack(spacing: 12) {
        ForEach(options, id: \.self) { option in
          Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            onPick(option)
          } label: {
            Text(option)
              .font(.system(size: 28, weight: .bold, design: .monospaced))
              .frame(maxWidth: .infinity)
              .padding(.vertical, 16)
          }
          .background(Color.expoSystemBackground)
          .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.secondary.opacity(0.3)))
          .cornerRadius(12)
          .accessibilityLabel("Number \(option)")
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}
