// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingMethodsView: View {
  @ObservedObject var viewModel: OnboardingViewModel

  var body: some View {
    VStack(spacing: 0) {
      Spacer()
      
      VStack(spacing: 8) {
        Text("Two ways to learn")
          .font(.system(size: 32, weight: .bold))
          .multilineTextAlignment(.center)

        Text("Start learning on your phone. When you're ready for more, our course walks you through setting up a local project too.")
          .font(.body)
          .foregroundColor(.expoSecondaryText)
          .multilineTextAlignment(.center)
      }
      .padding(.vertical, 24)
            
      VStack(spacing: 14) {
        MethodCard(
          icon: "iphone",
          title: "Learn on your phone",
          items: [
            ("Read", "Follow bite-sized lessons"),
            ("Edit", "Write real code right here"),
            ("See", "Watch your changes instantly"),
          ]
        )
        
        MethodCard(
          icon: "desktopcomputer",
          title: "Learn with your computer",
          items: [
            ("Set up", "Create a project on your machine"),
            ("Code", "Get more space to write with a full editor"),
            ("Preview", "See your work live on your phone"),
          ]
        )
        
        MethodCard(
          icon: "chevron.left.forwardslash.chevron.right",
          title: "Build",
          items: []
        )
      }
      
      Spacer()

      VStack(spacing: 12) {
        OnboardingPrimaryButton(title: "Continue") {
          viewModel.advance()
        }

        OnboardingSkipButton {
          viewModel.skip()
        }
      }
    }
    .padding(.horizontal, 24)
  }
}

private struct MethodCard: View {
  let icon: String
  let title: String
  let items: [(label: String, detail: String)]

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(spacing: 10) {
        Image(systemName: icon)
          .font(.system(size: 18))
          .foregroundColor(.primary)
          .frame(width: 24, height: 24)

        Text(title)
          .font(.system(size: 17, weight: .semibold))
      }

      if !items.isEmpty {
        VStack(alignment: .leading, spacing: 10) {
          ForEach(items, id: \.label) { item in
            HStack(spacing: 0) {
              Text(item.label)
                .font(.system(size: 12, weight: .medium))
              Text(" - \(item.detail)")
                .font(.system(size: 12))
                .foregroundColor(.expoSecondaryText)
            }
          }
        }
        .padding(.leading, 34)
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    .overlay(
      RoundedRectangle(cornerRadius: BorderRadius.large)
        .stroke(Color.expoSystemGray5, lineWidth: 1)
    )
  }
}
