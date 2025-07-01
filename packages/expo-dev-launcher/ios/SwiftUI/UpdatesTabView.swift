// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

func getDevLauncherBundle() -> Bundle? {
  if let bundleURL = Bundle.main.url(forResource: "EXDevLauncher", withExtension: "bundle") {
    if let bundle = Bundle(url: bundleURL) {
      return bundle
    }
  }

  // fallback to the main bundle
  return .main
}

struct UpdatesTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var branches: [BranchWithUpdates] = []
  @State private var isLoading = false
  @State private var errorMessage: String?
  
  var body: some View {
    VStack(spacing: 0) {
      DevLauncherNavigationHeader()
      
      if !viewModel.isLoggedIn {
        notLoggedInView
      } else if !viewModel.structuredBuildInfo.usesEASUpdates {
        notUsingEASUpdatesView
      } else {
        updatesView
      }
    }
    .background(Color(.systemGroupedBackground))
    .onAppear {
      if viewModel.isLoggedIn && viewModel.structuredBuildInfo.usesEASUpdates {
        loadBranches()
      }
    }
  }

  private var notLoggedInView: some View {
    List {
      Section {
        VStack(spacing: 16) {
          Image(systemName: "arrow.2.circlepath")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 44, height: 44)
            .foregroundColor(.blue)

          VStack(spacing: 8) {
            Text("Sign in to view updates")
              .font(.headline)
              .multilineTextAlignment(.center)
            
            Text("Sign in to your Expo account to see available EAS Updates for this project.")
              .font(.system(size: 14))
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
          }
        }
      }
    }
  }
  
  private var notUsingEASUpdatesView: some View {
    List {
      Section {
        VStack(spacing: 16) {
          Image(systemName: "exclamationmark.triangle")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 44, height: 44)
            .foregroundColor(.orange)

          VStack(spacing: 8) {
            Text("EAS Update not configured")
              .font(.headline)
              .multilineTextAlignment(.center)
            
            Text("This project is not configured to use EAS Update. Configure EAS Update to see available updates here.")
              .font(.system(size: 14))
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
            
            if let destination = URL(string: "https://docs.expo.dev/eas-update/getting-started/") {
              Link("Learn more about EAS Update", destination: destination)
                .font(.system(size: 14))
                .foregroundColor(.blue)
            }
          }
        }
      }
    }
  }
  
  private var updatesView: some View {
    List {
      if isLoading {
        Section {
          HStack {
            Spacer()
            ProgressView()
              .scaleEffect(1.2)
            Spacer()
          }
          .padding()
        }
      } else if let error = errorMessage {
        Section {
          VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
              .foregroundColor(.red)
              .font(.title2)
            
            Text("Error loading updates")
              .font(.headline)
            
            Text(error)
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
      } else if branches.isEmpty {
        Section {
          VStack(spacing: 16) {
            Image(systemName: "tray")
              .font(.largeTitle)
              .foregroundColor(.gray)
            
            Text("No updates available")
              .font(.headline)
            
            Text("No compatible updates found for this runtime version.")
              .font(.caption)
              .foregroundStyle(.secondary)
              .multilineTextAlignment(.center)
          }
          .padding()
        }
      } else {
        ForEach(branches, id: \.id) { branch in
          branchSection(branch)
        }
      }
    }
    .refreshable {
      loadBranches()
    }
  }
  
  private func branchSection(_ branch: BranchWithUpdates) -> some View {
    Section(header: Text(branch.name).font(.headline)) {
      if branch.updates.isEmpty {
        Text("No updates available")
          .foregroundStyle(.secondary)
          .font(.caption)
      } else {
        ForEach(branch.updates.prefix(3), id: \.id) { update in
          updateRow(update)
        }
        
        if branch.updates.count > 3 {
          NavigationLink("View all \(branch.updates.count) updates") {
            UpdatesListView(branchName: branch.name, appId: viewModel.structuredBuildInfo.appId)
          }
          .font(.caption)
          .foregroundColor(.blue)
        }
      }
    }
  }
  
  private func updateRow(_ update: Update) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text(update.message.isEmpty ? "Update \(String(update.id.prefix(8)))" : update.message)
            .font(.system(size: 14, weight: .medium))
            .lineLimit(2)
          
          Text(formatDate(update.createdAt))
            .font(.caption2)
            .foregroundStyle(.secondary)
          
          Text("Runtime: \(update.runtimeVersion)")
            .font(.caption2)
            .foregroundStyle(isCompatibleRuntime(update.runtimeVersion) ? .green : .orange)
        }
        
        Spacer()
        
        Button("Launch") {
          launchUpdate(update)
        }
        .buttonStyle(.bordered)
        .controlSize(.small)
        .disabled(!isCompatibleRuntime(update.runtimeVersion))
      }
    }
    .padding(.vertical, 4)
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
  
  private func launchUpdate(_ update: Update) {
    let updateUrl = formatUpdateUrl(update.manifestPermalink, update.message)
    viewModel.openApp(url: updateUrl)
  }
  
  private func formatUpdateUrl(_ permalink: String, _ message: String) -> String {
    let updatePermalinkQuery = "url=\(permalink.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
    let updateMessageQuery = "updateMessage=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
    return "expo-dev-client://expo-development-client?\(updatePermalinkQuery)&\(updateMessageQuery)"
  }
  
  private func isCompatibleRuntime(_ runtimeVersion: String) -> Bool {
    return runtimeVersion == viewModel.structuredBuildInfo.runtimeVersion
  }
  
  private func formatDate(_ date: String) -> String {
    let formatter = ISO8601DateFormatter()
    if let formattedDate = formatter.date(from: date) {
      let displayFormatter = DateFormatter()
      displayFormatter.dateStyle = .medium
      displayFormatter.timeStyle = .short
      return displayFormatter.string(from: formattedDate)
    }
    return date
  }
}

struct UpdatesListView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  let branchName: String
  let appId: String

  @State private var updates: [Update] = []
  @State private var filteredUpdates: [Update] = []
  @State private var filterByCompatibility = false
  @State private var sortByRecency = true
  @State private var isLoading = false
  @State private var errorMessage: String?
    
  var body: some View {
    VStack(spacing: 0) {
      DevLauncherNavigationHeader()
      
      List {
        Section {
          HStack {
            Toggle("Compatible only", isOn: $filterByCompatibility)
            Spacer()
            Button(sortByRecency ? "Newest first" : "Oldest first") {
              sortByRecency.toggle()
            }
            .font(.caption)
            .foregroundColor(.blue)
          }
          .padding(.vertical, 4)
        }
        
        Section("Updates") {
          ForEach(filteredUpdates, id: \.id) { update in
            UpdateRow(update: update, isCompatible: isCompatibleRuntime(update.runtimeVersion))
          }
        }
      }
    }
    .background(Color(.systemGroupedBackground))
    .navigationTitle(branchName)
    .navigationBarTitleDisplayMode(.large)
    .onChange(of: filterByCompatibility) { _ in
      applyFilters()
    }
    .onChange(of: sortByRecency) { _ in
      applyFilters()
    }
    .onAppear {
      loadUpdates()
    }
  }
  
  private func loadUpdates() {
    isLoading = true
    errorMessage = nil
    
    Task {
      do {
        let (fetchedUpdates, _) = try await Queries.getUpdatesForBranch(
          appId: appId,
          branchName: branchName,  
          page: 1,
          pageSize: 50
        )
        
        await MainActor.run {
          self.updates = fetchedUpdates
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
      filtered = filtered.filter { isCompatibleRuntime($0.runtimeVersion) }
    }
    
    filtered.sort { update1, update2 in
      let formatter = ISO8601DateFormatter()
      let date1 = formatter.date(from: update1.createdAt) ?? Date.distantPast
      let date2 = formatter.date(from: update2.createdAt) ?? Date.distantPast
      
      return sortByRecency ? date1 > date2 : date1 < date2
    }
    
    filteredUpdates = filtered
  }
  
  private func isCompatibleRuntime(_ runtimeVersion: String) -> Bool {
    return runtimeVersion == viewModel.structuredBuildInfo.runtimeVersion
  }
}

struct UpdateRow: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  let update: Update
  let isCompatible: Bool
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        VStack(alignment: .leading, spacing: 4) {
          Text(update.message.isEmpty ? "Update \(String(update.id.prefix(8)))" : update.message)
            .font(.system(size: 15, weight: .medium))
            .lineLimit(3)
          
          HStack {
            Text(formatDate(update.createdAt))
              .font(.caption)
              .foregroundStyle(.secondary)
            
            Spacer()
            
            Text("Runtime: \(update.runtimeVersion)")
              .font(.caption)
              .padding(.horizontal, 8)
              .padding(.vertical, 2)
              .background(isCompatible ? Color.green.opacity(0.2) : Color.orange.opacity(0.2))
              .foregroundStyle(isCompatible ? .green : .orange)
              .cornerRadius(4)
          }
        }
        
        Button("Open") {
          launchUpdate(update)
        }
        .buttonStyle(.bordered)
        .controlSize(.small)
        .disabled(!isCompatible)
      }
    }
    .padding(.vertical, 4)
  }
  
  private func launchUpdate(_ update: Update) {
    let updateUrl = formatUpdateUrl(update.manifestPermalink, update.message)
    viewModel.openApp(url: updateUrl)
  }
  
  private func formatUpdateUrl(_ permalink: String, _ message: String) -> String {
    let updatePermalink = "url=\(permalink.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
    let updateMessage = "updateMessage=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
    return "expo-dev-client://expo-development-client?\(updatePermalink)&\(updateMessage)"
  }
  
  private func formatDate(_ dateString: String) -> String {
    let formatter = ISO8601DateFormatter()
    if let date = formatter.date(from: dateString) {
      let displayFormatter = DateFormatter()
      displayFormatter.dateStyle = .medium
      displayFormatter.timeStyle = .short
      return displayFormatter.string(from: date)
    }
    return dateString
  }
}

#Preview {
  UpdatesTabView()
}
