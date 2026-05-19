// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingPrimaryButton: View {
  @Environment(\.colorScheme) private var colorScheme
  let title: String
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Text(title)
        .font(.system(size: 17, weight: .semibold))
        .foregroundColor(colorScheme == .dark ? .black : .white)
        .frame(maxWidth: .infinity)
        .padding()
        .background(colorScheme == .dark ? Color.white : Color.black)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
  }
}

struct OnboardingSkipButton: View {
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Text("Skip")
        .font(.system(size: 15, weight: .medium))
        .foregroundColor(.expoSecondaryText)
    }
  }
}
