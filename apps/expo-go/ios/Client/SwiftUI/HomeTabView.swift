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

          if !viewModel.projects.isEmpty && viewModel.isLoggedIn {
            ProjectsSection()
          }

          if !viewModel.snacks.isEmpty && viewModel.isLoggedIn {
            SnacksSection()
          }
        }
        .padding()
      }
      .background(Color.expoSystemBackground)
      .refreshable {
        await viewModel.refreshData()
      }
    }
  }
}
