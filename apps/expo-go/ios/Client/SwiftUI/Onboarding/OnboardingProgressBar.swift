// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingProgressBar: View {
  let currentStep: Int
  let totalSteps: Int

  var body: some View {
    HStack(spacing: 6) {
      ForEach(0..<totalSteps, id: \.self) { index in
        ProgressSegment(isFilled: index <= currentStep)
      }
    }
    .padding()
  }
}

private struct ProgressSegment: View {
  let isFilled: Bool

  var body: some View {
    GeometryReader { geometry in
      ZStack(alignment: .leading) {
        RoundedRectangle(cornerRadius: 2)
          .fill(Color.expoSystemGray5)

        RoundedRectangle(cornerRadius: 2)
          .fill(Color.expoBlue)
          .frame(width: isFilled ? geometry.size.width : 0)
          .animation(.easeInOut(duration: 0.4), value: isFilled)
      }
    }
    .frame(height: 4)
  }
}
