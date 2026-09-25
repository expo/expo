import SwiftUI

struct BranchDetailsView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  let branchName: String

  @State private var updates: [Update] = []
  @State private var isLoadingInitial = false
  @State private var isLoadingMore = false
  @State private var errorMessage: String?
  @State private var pagination = OffsetPaginationState(pageSize: 20)

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        if isLoadingInitial && updates.isEmpty {
          loading
        } else if let message = errorMessage, updates.isEmpty {
          errorView(message: message)
        } else if updates.isEmpty {
          emptyUpdates
        } else {
          Text("UPDATES")
            .font(.caption)
            .foregroundStyle(.secondary)

          LazyVStack(spacing: 8) {
            ForEach(updates, id: \.id) { update in
              UpdateRow(
                update: update,
                isCompatible: viewModel.isCompatibleRuntime(update.runtimeVersion)
              )
            }

            if isLoadingMore {
              loading
            } else if let message = errorMessage {
              retryRow(message: message)
            } else if pagination.hasMore {
              loadMoreButton
            }
          }
        }
      }
      .padding()
    }
    .refreshable {
      await refreshUpdates()
    }
    .task {
      await loadInitialUpdates()
    }
    .navigationTitle(branchName)
    .navigationBarTitleDisplayMode(.inline)
  }

  private var loadMoreButton: some View {
    Button("Load more updates") {
      Task {
        await loadMoreUpdates()
      }
    }
    .buttonStyle(.bordered)
    .frame(maxWidth: .infinity)
    .padding(.top, 4)
  }

  @MainActor
  private func loadInitialUpdates() async {
    guard updates.isEmpty else {
      return
    }

    await refreshUpdates()
  }

  /// Reloads the branch from the first page, discarding any pages already fetched.
  @MainActor
  private func refreshUpdates() async {
    guard !isLoadingInitial, !isLoadingMore else {
      return
    }

    isLoadingInitial = true
    defer { isLoadingInitial = false }

    do {
      let fetchedUpdates = try await Queries.getUpdatesForBranch(
        appId: viewModel.structuredBuildInfo.appId,
        branchName: branchName,
        offset: 0,
        limit: pagination.pageSize
      )

      guard !Task.isCancelled else {
        return
      }

      updates = fetchedUpdates
      pagination.reset()
      pagination.didReceivePage(itemCount: fetchedUpdates.count)
      errorMessage = nil
    } catch {
      if !Task.isCancelled {
        errorMessage = error.localizedDescription
      }
    }
  }

  @MainActor
  private func loadMoreUpdates() async {
    guard !isLoadingInitial, !isLoadingMore, pagination.hasMore else {
      return
    }

    isLoadingMore = true
    defer { isLoadingMore = false }

    do {
      let fetchedUpdates = try await Queries.getUpdatesForBranch(
        appId: viewModel.structuredBuildInfo.appId,
        branchName: branchName,
        offset: pagination.offset,
        limit: pagination.pageSize
      )

      guard !Task.isCancelled else {
        return
      }

      updates.append(contentsOf: fetchedUpdates)
      pagination.didReceivePage(itemCount: fetchedUpdates.count)
      errorMessage = nil
    } catch {
      if !Task.isCancelled {
        errorMessage = error.localizedDescription
      }
    }
  }

  private var loading: some View {
    HStack {
      Spacer()
      ProgressView()
        .scaleEffect(1.2)
      Spacer()
    }
    .padding()
  }

  private func errorView(message: String) -> some View {
    VStack(spacing: 12) {
      Image(systemName: "exclamationmark.triangle")
        .foregroundColor(.red)
        .font(.title2)

      Text("Error loading updates")
        .font(.headline)

      Text(message)
        .font(.caption)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)

      Button("Retry") {
        Task {
          await refreshUpdates()
        }
      }
      .buttonStyle(.borderedProminent)
    }
    .padding()
  }

  private func retryRow(message: String) -> some View {
    VStack(spacing: 8) {
      Text(message)
        .font(.caption)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)

      Button("Retry") {
        Task {
          await loadMoreUpdates()
        }
      }
      .buttonStyle(.bordered)
    }
    .frame(maxWidth: .infinity)
    .padding()
  }

  private var emptyUpdates: some View {
    VStack(spacing: 8) {
      Text("No updates available")
        .font(.headline)

      Text("Publish an update to this branch and it will appear here.")
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity)
    .padding()
  }
}
