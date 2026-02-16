//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct BranchesListView: View {
  let projectId: String
  @StateObject private var viewModel: BranchesListViewModel

  init(projectId: String) {
    self.projectId = projectId
    self._viewModel = StateObject(wrappedValue: BranchesListViewModel(projectId: projectId))
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        if viewModel.isLoading && viewModel.branches.isEmpty {
          ProgressView()
            .frame(maxWidth: .infinity)
            .padding(40)
        } else if viewModel.branches.isEmpty {
          EmptyStateView(
            icon: "arrow.branch",
            message: "No branches",
            description: "Push updates to create branches"
          )
        } else {
          VStack(spacing: 6) {
            ForEach(viewModel.branches) { branch in
              NavigationLink(destination: BranchDetailsView(projectId: projectId, branchName: branch.name)) {
                BranchRowContent(branch: branch)
              }
              .buttonStyle(PlainButtonStyle())
            }

            if viewModel.hasMore && !viewModel.isLoading {
              Button("Load more") {
                Task {
                  await viewModel.loadMore()
                }
              }
              .frame(maxWidth: .infinity)
              .padding()
              .background(Color.expoSecondarySystemGroupedBackground)
              .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
            }

            if viewModel.isLoading && !viewModel.branches.isEmpty {
              ProgressView()
                .padding()
            }
          }
        }
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Branches")
    .navigationBarTitleDisplayMode(.inline)
    .task {
      await viewModel.loadInitial()
    }
    .alert("Error", isPresented: $viewModel.showingError) {
      Button("OK") {
        viewModel.showingError = false
      }
    } message: {
      if let error = viewModel.error {
        Text(error.localizedDescription)
      }
    }
  }

}

@MainActor
class BranchesListViewModel: ObservableObject {
  @Published var branches: [BranchDetail] = []
  @Published var isLoading = false
  @Published var showingError = false
  @Published var error: Error?
  @Published var hasMore = false
  @Published var projectName = "Project"

  private let projectId: String
  private var currentOffset = 0
  private let pageSize = 25
  private var totalCount = 0

  init(projectId: String) {
    self.projectId = projectId
  }

  func loadInitial() async {
    guard branches.isEmpty else { return }
    currentOffset = 0
    await fetchBranches()
  }

  func loadMore() async {
    guard !isLoading, hasMore else { return }
    currentOffset += pageSize
    await fetchBranches()
  }

  private func fetchBranches() async {
    isLoading = true
    defer { isLoading = false }

    do {
      let response: BranchesListResponse = try await APIClient.shared.request(
        Queries.getBranchesList(),
        variables: [
          "appId": projectId,
          "limit": pageSize,
          "offset": currentOffset,
          "platform": "IOS"
        ]
      )

      let newBranches = response.data.app.byId.updateBranches
      totalCount = response.data.app.byId.updateBranchesCount
      projectName = response.data.app.byId.name

      if currentOffset == 0 {
        branches = newBranches
      } else {
        branches.append(contentsOf: newBranches)
      }

      hasMore = branches.count < totalCount
    } catch {
      self.error = error
      self.showingError = true
    }
  }
}
