//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectsAndSnacksSection: View {
  @EnvironmentObject var viewModel: HomeViewModel

  private var hasProjects: Bool { !viewModel.projects.isEmpty }
  private var hasSnacks: Bool { !viewModel.snacks.isEmpty }
  private var isLoading: Bool { viewModel.isLoadingData }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "PROJECTS")

      if isLoading && !hasProjects && !hasSnacks {
        // Loading state
        VStack(spacing: 6) {
          ForEach(0..<3, id: \.self) { _ in
            ProjectSkeletonRow()
          }
        }
      } else if !hasProjects && !hasSnacks && !isLoading {
        // Empty state
        EmptyStateView(
          icon: "folder",
          message: "No projects yet",
          description: "Create your first project on expo.dev"
        )
      } else {
        VStack(spacing: 6) {
          // Projects
          ForEach(viewModel.projects.prefix(3)) { project in
            ProjectRowWithNavigation(project: project, shouldNavigateToDetails: false)
          }

          if viewModel.projects.count > 3 {
            NavigationLink(destination: ProjectsListView(accountName: viewModel.selectedAccount?.name ?? "")) {
              Text("See all projects")
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.expoSecondarySystemGroupedBackground)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
            }
          }

          // Separator between projects and snacks (only if both exist)
          if hasProjects && hasSnacks {
            Text("•  •  •")
              .font(.caption)
              .foregroundColor(.secondary)
              .frame(maxWidth: .infinity)
              .padding(.vertical, 4)
          }

          // Snacks
          ForEach(viewModel.snacks.prefix(3)) { snack in
            SnackRowWithAction(snack: snack)
          }

          if viewModel.snacks.count > 3 {
            NavigationLink(destination: SnacksListView(accountName: viewModel.selectedAccount?.name ?? "")) {
              Text("See all snacks")
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.expoSecondarySystemGroupedBackground)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
            }
          }
        }
      }
    }
  }
}

struct ProjectsSection: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "PROJECTS")

      VStack(spacing: 6) {
        ForEach(viewModel.projects.prefix(3)) { project in
          ProjectRowWithNavigation(project: project, shouldNavigateToDetails: false)
        }

        if viewModel.projects.count > 3 {
          NavigationLink(destination: ProjectsListView(accountName: viewModel.selectedAccount?.name ?? "")) {
            Text("See all projects")
              .frame(maxWidth: .infinity)
              .padding()
              .background(Color.expoSecondarySystemGroupedBackground)
              .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
          }
        }
      }
    }
  }
}

struct ProjectRowWithNavigation: View {
  let project: ExpoProject
  let shouldNavigateToDetails: Bool
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var shouldNavigate = false

  var body: some View {
    if shouldNavigateToDetails {
      NavigationLink(
        destination: ProjectDetailsView(projectId: project.id, initialProject: project),
        isActive: $shouldNavigate
      ) {
        ProjectRow(project: project) {
          handleProjectTap()
        }
      }
    } else {
      ProjectRow(project: project) {
        handleProjectTap()
      }
    }
  }

  private func handleProjectTap() {
    if shouldNavigateToDetails {
      if project.firstTwoBranches.count == 1 {
        let branch = project.firstTwoBranches[0]
        if branch.updates.count == 1 {
          let update = branch.updates[0]
          if isSDKCompatible(update.expoGoSDKVersion) {

            viewModel.openApp(url: update.manifestPermalink)
            viewModel.addToRecentlyOpened(
              url: update.manifestPermalink,
              name: project.name,
              iconUrl: nil
            )
            return
          }
        }
      }
      shouldNavigate = true
    } else {
      if let branch = project.firstTwoBranches.first,
         let update = branch.updates.first {
        viewModel.openApp(url: update.manifestPermalink)
        viewModel.addToRecentlyOpened(
          url: update.manifestPermalink,
          name: project.name,
          iconUrl: nil
        )
      }
    }
  }
}
