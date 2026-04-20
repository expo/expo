//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectsListView: View {
  let accountName: String
  @StateObject private var viewModel: ProjectsListViewModel
  @Environment(\.dismiss) private var dismiss

  init(accountName: String) {
    self.accountName = accountName
    self._viewModel = StateObject(wrappedValue: ProjectsListViewModel(accountName: accountName))
  }

  var body: some View {
    ScrollView {
      LazyVStack(spacing: 6) {
        if viewModel.isLoading && viewModel.projects.isEmpty {
          ForEach(0..<3, id: \.self) { _ in
            ProjectSkeletonRow()
          }
        }

        ForEach(viewModel.projects) { project in
          ProjectRowWithNavigation(project: project, shouldNavigateToDetails: true)
        }

        if viewModel.hasMore && !viewModel.isLoading {
          Button("Load More") {
            Task {
              await viewModel.loadMore()
            }
          }
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
        }

        if viewModel.isLoading && !viewModel.projects.isEmpty {
          ProgressView()
            .padding()
        }
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Projects")
    .navigationBarTitleDisplayMode(.inline)
    .refreshable {
      await viewModel.refresh()
    }
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
class ProjectsListViewModel: ObservableObject {
  @Published var projects: [ExpoProject] = []
  @Published var isLoading = false
  @Published var showingError = false
  @Published var error: Error?
  @Published var hasMore = false

  private let accountName: String
  private var currentOffset = 0
  private let pageSize = 15
  private var totalCount = 0

  init(accountName: String) {
    self.accountName = accountName
  }

  func loadInitial() async {
    guard projects.isEmpty else { return }
    currentOffset = 0
    await fetchProjects()
  }

  func refresh() async {
    currentOffset = 0
    projects = []
    await fetchProjects()
  }

  func loadMore() async {
    guard !isLoading, hasMore else { return }
    currentOffset += pageSize
    await fetchProjects()
  }

  private func fetchProjects() async {
    isLoading = true
    defer { isLoading = false }

    do {
      let response: ProjectsListResponse = try await APIClient.shared.request(
        Queries.getProjectsList(),
        variables: [
          "accountName": accountName,
          "limit": pageSize,
          "offset": currentOffset,
          "platform": "IOS"
        ]
      )

      let newProjects = response.data.account.byName.apps.map { $0.toExpoProject() }
      totalCount = response.data.account.byName.appCount

      if currentOffset == 0 {
        projects = newProjects
      } else {
        projects.append(contentsOf: newProjects)
      }

      hasMore = projects.count < totalCount
    } catch {
      self.error = error
      self.showingError = true
    }
  }
}
