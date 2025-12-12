//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectDetailsView: View {
  let projectId: String
  @StateObject private var viewModel: ProjectDetailsViewModel
  @EnvironmentObject var homeViewModel: HomeViewModel

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
                  BranchRow(branch: branch) {
                    openBranch(branch)
                  }
                }

                if project.updateBranches.count > 3 {
                  Button("See all branches (\(project.updateBranches.count))") {
                    // TODO: Navigate to branches list
                  }
                  .frame(maxWidth: .infinity)
                  .padding()
                  .background(Color.expoSecondarySystemGroupedBackground)
                  .clipShape(RoundedRectangle(cornerRadius: 12))
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
    .task {
      await viewModel.loadProject()
    }
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
        Text("by \(project.ownerAccount.name)")
          .font(.caption)
          .foregroundColor(.secondary)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }

  private func openBranch(_ branch: BranchDetail) {
    guard let update = branch.updates.first else {
      homeViewModel.showErrorAlert("This branch has no published updates")
      return
    }

    homeViewModel.openApp(url: update.manifestPermalink)
    homeViewModel.addToRecentlyOpened(
      url: update.manifestPermalink,
      name: "\(viewModel.project?.name ?? "Project") - \(branch.name)",
      iconUrl: nil
    )
  }
}

@MainActor
class ProjectDetailsViewModel: ObservableObject {
  @Published var project: ProjectDetail?
  @Published var isLoading = false
  @Published var error: Error?

  private let projectId: String
  private let hasMoreBranches: Bool

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
      self.hasMoreBranches = initialProject.firstTwoBranches.count == 2
    } else {
      self.hasMoreBranches = true
    }
  }

  func loadProject() async {
    if project != nil && !hasMoreBranches {
      return
    }

    if project != nil && !hasMoreBranches {
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
    } catch {
      self.error = error
    }
  }
}
