//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct HomeTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(spacing: 0) {
      NavigationHeader()

      ScrollView {
        VStack(spacing: 20) {
          DevelopmentServersSection()

          if !viewModel.recentlyOpenedApps.isEmpty {
            RecentlyOpenedSection()
          }

          if viewModel.isLoggedIn {
            if viewModel.isLoadingData && viewModel.projects.isEmpty {
              ProjectsLoadingSection()
            } else if !viewModel.projects.isEmpty {
              ProjectsSection()
            } else if !viewModel.isLoadingData {
              VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "PROJECTS")
                EmptyStateView(
                  icon: "folder",
                  message: "No projects yet",
                  description: "Create your first project on expo.dev"
                )
              }
            }

            if viewModel.isLoadingData && viewModel.snacks.isEmpty {
              SnacksLoadingSection()
            } else if !viewModel.snacks.isEmpty {
              SnacksSection()
            } else if !viewModel.isLoadingData {
              VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "SNACKS")
                EmptyStateView(
                  icon: "play.rectangle",
                  message: "No snacks yet",
                  description: "Try Snack to experiment with Expo"
                )
              }
            }
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
      viewModel.onViewWillAppear()
    }
    .onDisappear {
      viewModel.onViewDidDisappear()
    }
  }
}
