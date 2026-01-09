//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectDetailsView: View {
  let projectId: String
  @StateObject private var viewModel: ProjectDetailsViewModel
  @EnvironmentObject var homeViewModel: HomeViewModel
  @State private var showingAllBranches = false

  init(projectId: String, initialProject: ExpoProject? = nil) {
    self.projectId = projectId
    self._viewModel = StateObject(wrappedValue: ProjectDetailsViewModel(projectId: projectId, initialProject: initialProject))
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        if viewModel.isLoading && viewModel.project == nil {
          ProgressView()
            .frame(maxWidth: .infinity)
            .padding(40)
        } else if let project = viewModel.project {
          projectHeader(project)

          VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "BRANCHES")

            if project.updateBranches.isEmpty {
              EmptyStateView(
                icon: "arrow.branch",
                message: "No EAS Update branches",
                description: "Push updates to create branches"
              )
            } else {
              VStack(spacing: 6) {
                ForEach(project.updateBranches.prefix(3)) { branch in
                  NavigationLink(destination: BranchDetailsView(projectId: projectId, branchName: branch.name)) {
                    BranchRowContent(branch: branch)
                  }
                  .buttonStyle(PlainButtonStyle())
                }

                if project.updateBranches.count > 3 {
                  Button("See all branches (\(project.updateBranches.count))") {
                    showingAllBranches = true
                  }
                  .frame(maxWidth: .infinity)
                  .padding()
                  .background(Color.expoSecondarySystemGroupedBackground)
                  .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
                }
              }
            }
          }
        } else if viewModel.error != nil {
          EmptyStateView(
            icon: "exclamationmark.triangle",
            message: "Failed to load project",
            description: "An unexpected error occurred",
            actionTitle: "Try Again",
            action: {
              Task {
                await viewModel.loadProject()
              }
            }
          )
        }
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle(viewModel.project?.name ?? "")
    .navigationBarTitleDisplayMode(.inline)
    .toolbar {
      ToolbarItem(placement: .navigationBarTrailing) {
        Button {
          if let project = viewModel.project {
            showShareSheet(for: project)
          }
        } label: {
          Image(systemName: "square.and.arrow.up")
        }
        .disabled(viewModel.project == nil)
      }
    }
    .task {
      await viewModel.loadProject()
    }
    .background(
      NavigationLink(
        destination: BranchesListView(projectId: projectId),
        isActive: $showingAllBranches
      ) {
        EmptyView()
      }
      .hidden()
    )
  }

  @ViewBuilder
  private func projectHeader(_ project: ProjectDetail) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(project.name)
        .font(.title)
        .fontWeight(.bold)

      Text(project.fullName)
        .font(.subheadline)
        .foregroundColor(.secondary)

      if !project.ownerAccount.name.isEmpty {
        Text("Owned by \(project.ownerAccount.name)")
          .font(.caption)
          .foregroundColor(.secondary)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
  }

  private func showShareSheet(for project: ProjectDetail) {
    let host = APIClient.shared.apiOrigin.replacingOccurrences(of: "https://", with: "")
    let expUrl = "exp://\(host)/\(project.fullName)"
    let activityView = UIActivityViewController(activityItems: [expUrl], applicationActivities: nil)
    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
       let root = scene.windows.first?.rootViewController {
      root.present(activityView, animated: true)
    }
  }
}

@MainActor
class ProjectDetailsViewModel: ObservableObject {
  @Published var project: ProjectDetail?
  @Published var isLoading = false
  @Published var error: Error?

  private let projectId: String
  private var hasLoadedRemote = false

  init(projectId: String, initialProject: ExpoProject? = nil) {
    self.projectId = projectId

    if let initialProject = initialProject {
      self.project = ProjectDetail(
        id: initialProject.id,
        name: initialProject.name,
        slug: "",
        fullName: initialProject.fullName,
        ownerAccount: OwnerAccount(name: ""),
        updateBranches: initialProject.firstTwoBranches.map { branch in
          BranchDetail(id: branch.id, name: branch.name, updates: branch.updates)
        }
      )
    }
  }

  func loadProject() async {
    if hasLoadedRemote {
      return
    }

    isLoading = true
    defer { isLoading = false }

    do {
      let response: ProjectDetailsResponse = try await APIClient.shared.request(
        Queries.getProjectDetails(),
        variables: [
          "appId": projectId,
          "platform": "IOS"
        ]
      )

      self.project = response.data.app.byId
      self.hasLoadedRemote = true
    } catch {
      self.error = error
    }
  }
}
