//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct HomeTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @StateObject private var reviewManager = UserReviewManager()

  var body: some View {
    VStack(spacing: 0) {
      NavigationHeader()

      ScrollView {
        VStack(spacing: 20) {
          NavigationLink(destination: FeedbackFormView(), isActive: $viewModel.showingFeedbackForm) {
            EmptyView()
          }

          if reviewManager.shouldShowReviewSection {
            UserReviewSection(reviewManager: reviewManager) {
              viewModel.showFeedbackForm()
            }
          }

          UpgradeWarningView()

          DevServersSection()

          if !viewModel.recentlyOpenedApps.isEmpty {
            RecentlyOpenedSection()
          }

          if viewModel.isLoggedIn {
            ProjectsAndSnacksSection()
          }
        }
        .padding()
      }
      .background(Color.expoSystemBackground)
      .refreshable {
        await viewModel.refreshData()
      }
    }
    .onAppear {
      reviewManager.recordHomeAppear()
      reviewManager.updateCounts(apps: viewModel.projects.count, snacks: viewModel.snacks.count)
    }
    .onChange(of: viewModel.projects.count) { _ in
      reviewManager.updateCounts(apps: viewModel.projects.count, snacks: viewModel.snacks.count)
    }
    .onChange(of: viewModel.snacks.count) { _ in
      reviewManager.updateCounts(apps: viewModel.projects.count, snacks: viewModel.snacks.count)
    }
  }
}
