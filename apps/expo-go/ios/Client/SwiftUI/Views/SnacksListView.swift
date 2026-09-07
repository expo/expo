//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SnacksListView: View {
  let accountName: String
  @StateObject private var viewModel: SnacksListViewModel
  @Environment(\.dismiss) private var dismiss

  init(accountName: String) {
    self.accountName = accountName
    self._viewModel = StateObject(wrappedValue: SnacksListViewModel(accountName: accountName))
  }

  var body: some View {
    ScrollView {
      LazyVStack(spacing: 6) {
        if viewModel.isLoading && viewModel.snacks.isEmpty {
          ForEach(0..<3, id: \.self) { _ in
            SnackSkeletonRow()
          }
        }

        ForEach(viewModel.snacks) { snack in
          SnackRowWithAction(snack: snack)
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

        if viewModel.isLoading && !viewModel.snacks.isEmpty {
          ProgressView()
            .padding()
        }
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Snacks")
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
class SnacksListViewModel: ObservableObject {
  @Published var snacks: [Snack] = []
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
    guard snacks.isEmpty else { return }
    endCursor = nil
    await fetchSnacks()
  }

  func refresh() async {
    endCursor = nil
    await fetchSnacks()
  }

  func loadMore() async {
    guard !isLoading, hasMore else { return }
    await fetchSnacks()
  }

  private func fetchSnacks() async {
    isLoading = true
    defer { isLoading = false }

    let isFirstPage = endCursor == nil
    var variables: [String: Any] = [
      "accountName": accountName,
      "first": pageSize
    ]
    if let endCursor {
      variables["after"] = endCursor
    }

    do {
      let response: SnacksListResponse = try await APIClient.shared.request(
        Queries.getSnacksList(),
        variables: variables
      )

      let connection = response.data.account.byName.snacksPaginated
      let newSnacks = connection.edges.map { $0.node }

      if isFirstPage {
        snacks = newSnacks
      } else {
        snacks.append(contentsOf: newSnacks)
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
