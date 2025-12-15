import SwiftUI
// swiftlint:disable closure_body_length

struct UpdatesListView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var branches: [BranchWithUpdates] = []
  @State private var updates: [(update: Update, branchName: String)] = []
  @State private var filteredUpdates: [(update: Update, branchName: String)] = []
  @State private var filterByCompatibility = false
  @State private var sortByRecency = true
  @State private var isLoading = false
  @State private var errorMessage: String?

  var body: some View {
    VStack(spacing: 20) {
      HStack {
        Toggle("Compatible only", isOn: $filterByCompatibility)
        Spacer()
        Button(sortByRecency ? "Newest first" : "Oldest first") {
          sortByRecency.toggle()
          applyFilters()
        }
        .font(.caption)
        .foregroundColor(.blue)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)

      if isLoading {
        loading
      } else if let message = errorMessage {
        createError(message: message)
      } else if filteredUpdates.isEmpty {
        emptyUpdates
      } else {
        LazyVStack(alignment: .leading) {
          Text("Updates (\(filteredUpdates.count))".uppercased())
            .font(.caption)
            .foregroundColor(.primary.opacity(0.6))
          ForEach(filteredUpdates, id: \.update.id) { tuple in
            UpdateRow(update: tuple.update, branchName: tuple.branchName, isCompatible: viewModel.isCompatibleRuntime(tuple.update.runtimeVersion))
          }
        }
      }
    }
    .padding()
    .onChange(of: filterByCompatibility) { _ in
      applyFilters()
    }
    .onChange(of: sortByRecency) { _ in
      applyFilters()
    }
    .onAppear {
      loadBranches()
    }
  }

  private func loadBranches() {
    isLoading = true
    errorMessage = nil

    Task {
      do {
        let fetchedBranches = try await Queries.getBranches(
          appId: viewModel.structuredBuildInfo.appId,
          offset: 0,
          limit: 50,
          runtimeVersion: viewModel.structuredBuildInfo.runtimeVersion,
          platform: "IOS"
        )

        var branchesWithUpdates: [BranchWithUpdates] = []

        for branch in fetchedBranches {
          do {
            let (updates, _) = try await Queries.getUpdatesForBranch(
              appId: viewModel.structuredBuildInfo.appId,
              branchName: branch.name,
              page: 1,
              pageSize: 10
            )

            let branchWithUpdates = BranchWithUpdates(
              id: branch.id,
              name: branch.name,
              updates: updates,
              hasCompatibleUpdates: !branch.compatibleUpdates.isEmpty
            )
            branchesWithUpdates.append(branchWithUpdates)
          } catch {
            let branchWithUpdates = BranchWithUpdates(
              id: branch.id,
              name: branch.name,
              updates: [],
              hasCompatibleUpdates: !branch.compatibleUpdates.isEmpty
            )
            branchesWithUpdates.append(branchWithUpdates)
          }
        }

        await MainActor.run {
          self.branches = branchesWithUpdates
          self.updates = branchesWithUpdates.flatMap { branch in
            branch.updates.map { update in
              (update: update, branchName: branch.name)
            }
          }
          self.applyFilters()
          self.isLoading = false
        }
      } catch {
        await MainActor.run {
          self.errorMessage = error.localizedDescription
          self.isLoading = false
        }
      }
    }
  }

  private func applyFilters() {
    var filtered = updates

    if filterByCompatibility {
      filtered = filtered.filter { viewModel.isCompatibleRuntime($0.update.runtimeVersion) }
    }

    filtered.sort {
      let formatter = DateFormatter()
      formatter.dateFormat = "MMMM d, yyyy, h:mma"

      let date1 = formatter.date(from: $0.update.createdAt) ?? Date.distantPast
      let date2 = formatter.date(from: $1.update.createdAt) ?? Date.distantPast

      return sortByRecency ? date1 > date2 : date1 < date2
    }

    filteredUpdates = filtered
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

  @ViewBuilder
  func createError(message: String) -> some View {
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
        loadBranches()
      }
      .buttonStyle(.borderedProminent)
    }
    .padding()
  }

  private var emptyUpdates: some View {
    Section {
      VStack(spacing: 16) {
        Image(systemName: "tray")
          .font(.largeTitle)
          .foregroundColor(.gray)

        Text("No updates available")
          .font(.headline)

        Text(filterByCompatibility ? "No compatible updates found for this runtime version." : "No updates found.")
          .font(.caption)
          .foregroundStyle(.secondary)
          .multilineTextAlignment(.center)
      }
      .padding()
    }
  }
}

#Preview {
  UpdatesListView()
}
// swiftlint:enable closure_body_length
