import SwiftUI

struct BranchesListView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var branches: [Branch] = []
  @State private var isLoadingInitial = false
  @State private var isLoadingMore = false
  @State private var errorMessage: String?
  @State private var pagination = CursorPaginationState(pageSize: 20)
  @State private var isSearchPresented = false
  @State private var searchText = ""

  /// How long to wait after the last keystroke before querying the server.
  private static let searchDebounce: Duration = .milliseconds(300)

  private var searchTerm: String? {
    let trimmedSearchText = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmedSearchText.isEmpty ? nil : trimmedSearchText
  }

  var body: some View {
    GeometryReader { geometry in
      ScrollView {
        VStack(alignment: .leading, spacing: 12) {
          listHeader

          if isLoadingInitial && branches.isEmpty {
            loading
          } else if let message = errorMessage, branches.isEmpty {
            errorView(message: message)
          } else if branches.isEmpty {
            emptyBranches
              .frame(
                maxWidth: .infinity,
                minHeight: geometry.size.height - (isSearchPresented ? 88 : 32),
                alignment: .center
              )
          } else {
            LazyVStack(spacing: 8) {
              ForEach(branches, id: \.id) { branch in
                NavigationLink {
                  BranchDetailsView(branchName: branch.name)
                    .environmentObject(viewModel)
                } label: {
                  branchCard(branch)
                }
                .buttonStyle(.plain)
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
        await reloadBranches()
      }
    }
    .task(id: searchTerm) {
      await searchTermDidChange()
    }
  }

  @ViewBuilder
  private var listHeader: some View {
    HStack {
      Text("BRANCHES")
        .font(.caption)
        .foregroundStyle(.secondary)

      Spacer()

      Button {
        isSearchPresented.toggle()
        if !isSearchPresented {
          searchText = ""
        }
      } label: {
        Image(systemName: isSearchPresented ? "xmark" : "magnifyingglass")
      }
      .accessibilityLabel(isSearchPresented ? "Close branch search" : "Search branches")
    }

    if isSearchPresented {
      HStack(spacing: 8) {
        Image(systemName: "magnifyingglass")
          .foregroundStyle(.secondary)
        TextField("Search branches", text: $searchText)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
        if !searchText.isEmpty {
          Button {
            searchText = ""
          } label: {
            Image(systemName: "xmark.circle.fill")
              .foregroundStyle(.secondary)
          }
          .accessibilityLabel("Clear branch search")
        }
      }
      .padding(10)
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 10))
    }
  }

  private var loadMoreButton: some View {
    Button("Load more branches") {
      Task {
        await loadMoreBranches()
      }
    }
    .buttonStyle(.bordered)
    .frame(maxWidth: .infinity)
    .padding(.top, 4)
  }

  /// Runs on first appearance and whenever the search term changes, debouncing keystrokes so
  /// each one doesn't turn into its own request.
  @MainActor
  private func searchTermDidChange() async {
    if searchTerm != nil {
      do {
        try await Task.sleep(for: Self.searchDebounce)
      } catch {
        // A newer search term replaced this one before the debounce elapsed.
        return
      }
    }

    await reloadBranches()
  }

  @MainActor
  private func reloadBranches() async {
    let requestedTerm = searchTerm

    isLoadingInitial = true
    defer { isLoadingInitial = false }

    do {
      let page = try await Queries.getBranches(
        appId: viewModel.structuredBuildInfo.appId,
        first: pagination.pageSize,
        after: nil,
        searchTerm: requestedTerm,
        runtimeVersion: viewModel.structuredBuildInfo.runtimeVersion,
        platform: "IOS"
      )

      guard !Task.isCancelled, requestedTerm == searchTerm else {
        return
      }

      branches = page.branches
      pagination.reset()
      pagination.didReceivePage(endCursor: page.endCursor, hasNextPage: page.hasNextPage)
      errorMessage = nil
    } catch {
      if !Task.isCancelled, requestedTerm == searchTerm {
        errorMessage = error.localizedDescription
      }
    }
  }

  @MainActor
  private func loadMoreBranches() async {
    guard !isLoadingInitial, !isLoadingMore, pagination.hasMore else {
      return
    }

    let requestedTerm = searchTerm

    isLoadingMore = true
    defer { isLoadingMore = false }

    do {
      let page = try await Queries.getBranches(
        appId: viewModel.structuredBuildInfo.appId,
        first: pagination.pageSize,
        after: pagination.cursor,
        searchTerm: requestedTerm,
        runtimeVersion: viewModel.structuredBuildInfo.runtimeVersion,
        platform: "IOS"
      )

      guard !Task.isCancelled, requestedTerm == searchTerm else {
        return
      }

      branches.append(contentsOf: page.branches)
      pagination.didReceivePage(endCursor: page.endCursor, hasNextPage: page.hasNextPage)
      errorMessage = nil
    } catch {
      if !Task.isCancelled, requestedTerm == searchTerm {
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

      Text("Error loading branches")
        .font(.headline)

      Text(message)
        .font(.caption)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)

      Button("Retry") {
        Task {
          await reloadBranches()
        }
      }
      .buttonStyle(.borderedProminent)
    }
    .padding()
  }

  private var emptyBranches: some View {
    VStack(spacing: 16) {
      Image(systemName: "arrow.triangle.branch")
        .resizable()
        .scaledToFit()
        .frame(width: 44, height: 44)
        .foregroundColor(.gray)

      VStack(spacing: 8) {
        Text(searchTerm == nil ? "No branches available" : "No matching branches")
          .font(.headline)
          .multilineTextAlignment(.center)

        Text(searchTerm == nil
          ? "Publish an update with EAS Update and it will appear here."
          : "Try a different branch name.")
          .font(.system(size: 14))
          .multilineTextAlignment(.center)
          .foregroundStyle(.secondary)

        if searchTerm == nil,
           let destination = URL(string: "https://docs.expo.dev/eas-update/getting-started/") {
          Link("Learn how to publish", destination: destination)
            .font(.system(size: 14))
            .foregroundColor(.blue)
        }
      }
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
          await loadMoreBranches()
        }
      }
      .buttonStyle(.bordered)
    }
    .frame(maxWidth: .infinity)
    .padding()
  }

  private func branchCard(_ branch: Branch) -> some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        BranchBadge(branchName: branch.name)
        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundStyle(.secondary)
      }

      if let update = branch.compatibleUpdate {
        HStack(alignment: .top, spacing: 8) {
          Image("update-icon", bundle: getDevLauncherBundle())
            .resizable()
            .frame(width: 16, height: 16)

          VStack(alignment: .leading, spacing: 4) {
            Text("Update \"\(update.message.isEmpty ? update.id : update.message)\"")
              .font(.system(size: 15, weight: .semibold))
              .lineLimit(1)
            Text("Published \(formattedUpdateDate(update.createdAt))")
              .font(.caption)
              .foregroundStyle(.secondary)
          }
        }
      } else {
        Label("No compatible update found for this branch.", systemImage: "exclamationmark.triangle")
          .font(.subheadline.weight(.medium))
          .foregroundStyle(.orange)
      }
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
