// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingWelcomeView: View {
  @ObservedObject var viewModel: OnboardingViewModel
  @State private var animated = false

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      ZStack {
        Image("Code")
          .resizable()
          .scaledToFit()
          .frame(height: 360)
          .rotationEffect(.degrees(animated ? -8 : 0))
          .offset(x: -40, y: 0)

        Image("welcome")
          .resizable()
          .scaledToFit()
          .frame(height: 360)
          .shadow(color: .black.opacity(0.3), radius: 12, x: -4, y: 4)
          .rotationEffect(.degrees(animated ? 5 : 0))
          .offset(x: 40, y: 0)
      }
      .padding(.bottom, 32)
      .onAppear {
        withAnimation(.spring(response: 0.7, dampingFraction: 0.7).delay(0.5)) {
          animated = true
        }
      }

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
