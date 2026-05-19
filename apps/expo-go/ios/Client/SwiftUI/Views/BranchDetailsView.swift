//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct BranchDetailsView: View {
  let projectId: String
  let branchName: String
  @StateObject private var viewModel: BranchDetailsViewModel
  @EnvironmentObject var homeViewModel: HomeViewModel
  @State private var loadingUpdateId: String?

  init(projectId: String, branchName: String) {
    self.projectId = projectId
    self.branchName = branchName
    self._viewModel = StateObject(wrappedValue: BranchDetailsViewModel(projectId: projectId, branchName: branchName))
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        if viewModel.isLoading && viewModel.branch == nil {
          ProgressView()
            .frame(maxWidth: .infinity)
            .padding(40)
        } else if let branch = viewModel.branch {
          BranchDetailsHeader(branchName: branchName, latestUpdate: branch.updates.first) {
            openUpdate(branch.updates.first)
          }

          VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "UPDATES")

            if branch.updates.isEmpty {
              EmptyStateView(
                icon: "arrow.branch",
                message: "No updates",
                description: "Publish an update to see it here"
              )
            } else {
              VStack(spacing: 6) {
                ForEach(branch.updates) { update in
                  let compatible = isSDKCompatible(update.expoGoSDKVersion)
                  UpdateRow(update: update, isCompatible: compatible, isLoading: loadingUpdateId == update.id) {
                    loadingUpdateId = update.id
                    openUpdate(update)
                  }
                  .disabled(homeViewModel.isLoadingApp)
                }
              }
            }
          }
        } else if viewModel.error != nil {
          EmptyStateView(
            icon: "exclamationmark.triangle",
            message: "Failed to load branch",
            description: "An unexpected error occurred",
            actionTitle: "Try Again",
            action: {
              Task {
                await viewModel.loadBranch()
              }
            }
          )
        }
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Branch")
    .navigationBarTitleDisplayMode(.inline)
    .refreshable {
      await viewModel.refresh()
    }
    .task {
      await viewModel.loadBranch()
    }
    .onChange(of: homeViewModel.isLoadingApp) { isLoading in
      if !isLoading {
        loadingUpdateId = nil
      }
    }
  }

  private func openUpdate(_ update: AppUpdate?) {
    guard let update else {
      homeViewModel.showError("This branch has no published updates")
      return
    }

    guard isSDKCompatible(update.expoGoSDKVersion) else {
      let updateSDK = update.expoGoSDKVersion ?? "unknown"
      homeViewModel.showError("Selected update uses unsupported SDK (\(updateSDK))")
      return
    }

    homeViewModel.openApp(url: update.manifestPermalink)
    homeViewModel.addToRecentlyOpened(
      url: update.manifestPermalink,
      name: "\(viewModel.projectName) - \(branchName)",
      iconUrl: nil
    )
  }
}

struct BranchDetailsHeader: View {
  let branchName: String
  let latestUpdate: AppUpdate?
  let onOpen: () -> Void

  var body: some View {
    HStack {
      HStack(spacing: 8) {
        Image("branch-icon")
          .foregroundColor(.primary)
        Text(branchName)
          .font(.headline)
      }

      Spacer()

      if let latestUpdate, isSDKCompatible(latestUpdate.expoGoSDKVersion) {
        Button("Open") {
          onOpen()
        }
        .font(.subheadline)
        .foregroundColor(.primary)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.expoSecondarySystemGroupedBackground)
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
      }
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
  }
}

@MainActor
class BranchDetailsViewModel: ObservableObject {
  @Published var branch: BranchDetail?
  @Published var projectName = "Project"
  @Published var isLoading = false
  @Published var error: Error?

  private let projectId: String
  private let branchName: String
  private var hasLoadedRemote = false

  init(projectId: String, branchName: String) {
    self.projectId = projectId
    self.branchName = branchName
  }

  func loadBranch() async {
    if hasLoadedRemote { return }
    isLoading = true
    defer { isLoading = false }

    do {
      let response: BranchDetailsResponse = try await APIClient.shared.request(
        Queries.getBranchDetails(),
        variables: [
          "appId": projectId,
          "branchName": branchName,
          "platform": "IOS"
        ]
      )

      projectName = response.data.app.byId.name
      branch = response.data.app.byId.updateBranchByName
      hasLoadedRemote = true
    } catch {
      self.error = error
    }
  }

  func refresh() async {
    hasLoadedRemote = false
    await loadBranch()
  }
}
