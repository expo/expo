// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingReadyView: View {
  let onStartLesson: () -> Void
  let onExplore: () -> Void
  
  @State private var animate = false

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      VStack(spacing: 20) {
        if #available(iOS 17.0, *) {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 48))
            .foregroundColor(Color("success"))
            .symbolEffect(.bounce, options: .nonRepeating)
        }
        
        Text("You're ready")
          .font(.system(size: 32, weight: .bold))
      }

      Spacer()

      VStack(spacing: 12) {
        OnboardingPrimaryButton(title: "Start first lesson") {
          onStartLesson()
        }

        Button {
          onExplore()
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
