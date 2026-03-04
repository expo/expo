// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingTopicsView: View {
  @ObservedObject var viewModel: OnboardingViewModel

  var body: some View {
    VStack(spacing: 10) {
      Spacer()
      
      Text("What do you want to learn?")
        .frame(width: UIScreen.main.bounds.width * 0.65)
        .font(.system(size: 32, weight: .bold))
        .multilineTextAlignment(.center)
        .padding(.bottom, 20)
      
      VStack(spacing: 10) {
        ForEach(OnboardingTopic.allCases) { topic in
          TopicCard(
            topic: topic,
            isSelected: viewModel.selectedTopics.contains(topic)
          ) {
            viewModel.toggleTopic(topic)
          }
        }
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

private struct TopicCard: View {
  let topic: OnboardingTopic
  let isSelected: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack(spacing: 14) {
        Image(systemName: topic.icon)
          .font(.system(size: 24))
          .foregroundColor(.primary)
          .frame(width: 40, height: 40)

        VStack(alignment: .leading, spacing: 2) {
          Text(topic.rawValue)
            .font(.system(size: 17, weight: .semibold))
            .foregroundColor(.primary)

          Text(topic.subtitle)
            .font(.system(size: 12))
            .foregroundColor(.expoSecondaryText)
        }

        Spacer()
      }
      .padding(14)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
      .overlay(
        RoundedRectangle(cornerRadius: BorderRadius.large)
          .stroke(isSelected ? Color.expoBlue : Color.expoSystemGray5, lineWidth: isSelected ? 2 : 1)
      )
    }
    .buttonStyle(PlainButtonStyle())
    .animation(.easeInOut(duration: 0.2), value: isSelected)
  }
}
