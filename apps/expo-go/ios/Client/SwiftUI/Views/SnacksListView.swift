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
  private var currentOffset = 0
  private let pageSize = 15

  init(accountName: String) {
    self.accountName = accountName
  }

  func loadInitial() async {
    guard snacks.isEmpty else { return }
    currentOffset = 0
    await fetchSnacks()
  }

  func refresh() async {
    currentOffset = 0
    snacks = []
    await fetchSnacks()
  }

  func loadMore() async {
    guard !isLoading else { return }
    currentOffset += pageSize
    await fetchSnacks()
  }

  private func fetchSnacks() async {
    isLoading = true
    defer { isLoading = false }

    do {
      let response: SnacksListResponse = try await APIClient.shared.request(
        Queries.getSnacksList(),
        variables: [
          "accountName": accountName,
          "limit": pageSize,
          "offset": currentOffset
        ]
      )

      let newSnacks = response.data.account.byName.snacks

      if currentOffset == 0 {
        snacks = newSnacks
      } else {
        snacks.append(contentsOf: newSnacks)
      }

      hasMore = newSnacks.count >= pageSize
    } catch {
      self.error = error
      self.showingError = true
    }
  }
}
