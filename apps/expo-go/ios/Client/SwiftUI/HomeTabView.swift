//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct HomeTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @StateObject private var reviewManager = UserReviewManager()
  @State private var showingURLInput = false
  @State private var urlText = ""

  var body: some View {
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

        NetworkPermissionBanner(serverService: viewModel.serverService)

        DevServersSection()

        if !viewModel.recentlyOpenedApps.isEmpty {
          RecentlyOpenedSection()
        }

        if viewModel.isLoggedIn {
          ProjectsAndSnacksSection()
        }
      }
      .maxContentWidth()
      .padding()
    }
    .background(Color.expoSystemBackground)
    .refreshable {
      await viewModel.refreshData()
    }
    .navigationTitle(HomeTab.home.title)
    .navigationBarTitleDisplayMode(.large)
    .homeToolbar(onEnterURL: { showingURLInput = true })
    .alert("Add project by URL", isPresented: $showingURLInput) {
      TextField("exp://192.168.1.1:8081", text: $urlText)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()
        .keyboardType(.URL)
      Button("Cancel", role: .cancel) {
        urlText = ""
      }
      Button("Connect", action: connect)
        .keyboardShortcut(.defaultAction)
        .disabled(!EnterURLForm.canConnect(urlText))
    } message: {
      Text("Enter the URL of your development server or project.")
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

  private func connect() {
    if let url = EnterURLForm.connectURL(urlText) {
      viewModel.openApp(url: url)
    }
    urlText = ""
  }
}
