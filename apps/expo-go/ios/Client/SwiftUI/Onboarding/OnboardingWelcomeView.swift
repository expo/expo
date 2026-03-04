// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingWelcomeView: View {
  @ObservedObject var viewModel: OnboardingViewModel

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      Image("onboarding-landing")
        .resizable()
        .scaledToFit()
        .frame(maxWidth: 240)
        .padding(.bottom, 32)

      VStack(spacing: 20) {
        Text("Learn to code\non your phone")
          .font(.system(size: 32, weight: .bold))
          .multilineTextAlignment(.center)

        Text("Expo Go is your mobile coding classroom. Write, edit, and run React code right on your device.")
          .font(.body)
          .foregroundColor(.expoSecondaryText)
          .multilineTextAlignment(.center)
      }

      Spacer()

      OnboardingPrimaryButton(title: "Get Started") {
        viewModel.advance()
      }
    }
    .padding(.horizontal, 24)
  }
}
