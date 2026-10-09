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
          Button {
            Task {
              await viewModel.loadMore()
            }
          } label: {
            Text("Load more")
              .frame(maxWidth: .infinity)
              .padding()
              .background(Color.expoSecondarySystemBackground)
              .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
              .contentShape(Rectangle())
          }
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
  private var endCursor: String?
  private let pageSize = 20

  init(accountName: String) {
    self.accountName = accountName
  }

  func loadInitial() async {
    guard projects.isEmpty else { return }
    endCursor = nil
    await fetchProjects()
  }

  func refresh() async {
    endCursor = nil
    await fetchProjects()
  }

  func loadMore() async {
    guard !isLoading, hasMore else { return }
    await fetchProjects()
  }

  private func fetchProjects() async {
    isLoading = true
    defer { isLoading = false }

    let isFirstPage = endCursor == nil
    var variables: [String: Any] = [
      "accountName": accountName,
      "first": pageSize,
      "platform": "IOS"
    ]
    if let endCursor {
      variables["after"] = endCursor
    }

    do {
      let response: ProjectsListResponse = try await APIClient.shared.request(
        Queries.getProjectsList(),
        variables: variables
      )

      let connection = response.data.account.byName.appsPaginated
      let newProjects = connection.edges.map { $0.node.toExpoProject() }

      if isFirstPage {
        projects = newProjects
      } else {
        projects.append(contentsOf: newProjects)
      }

      hasMore = connection.pageInfo?.hasNextPage ?? false
      endCursor = connection.pageInfo?.endCursor
    } catch {
      if (error as? APIError)?.isCancellation == true {
        return
      }
      self.error = error
      self.showingError = true
    }
  }
}
