// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingReadyView: View {
  let onComplete: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      VStack(spacing: 20) {
        Image(systemName: "checkmark.circle.fill")
          .font(.system(size: 48))
          .foregroundColor(Color("success"))
        
        Text("You're ready")
          .font(.system(size: 32, weight: .bold))
      }

      Spacer()

      VStack(spacing: 12) {
        OnboardingPrimaryButton(title: "Start first lesson") {
          onComplete()
        }

        Button {
          onComplete()
        } label: {
          Text("Explore lessons")
            .font(.system(size: 15, weight: .medium))
        }
        .buttonStyle(.plain)
      }
    }
    .padding(.horizontal, 24)
  }
}
