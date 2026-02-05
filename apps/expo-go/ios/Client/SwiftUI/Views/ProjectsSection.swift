//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import EXDevMenu

struct ProjectsAndSnacksSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var loadingProjectId: String?
  @State private var loadingSnackId: String?
  @State private var isLoadingDemoProject = false

  // TEMPORARY: remove after testing
  private var hasProjects: Bool { false && !viewModel.projects.isEmpty }
  // TEMPORARY: remove after testing
  private var hasSnacks: Bool { false && !viewModel.snacks.isEmpty }
  private var isLoadingData: Bool { viewModel.isLoadingData }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "PROJECTS")

      if isLoadingData && !hasProjects && !hasSnacks {
        // Loading state
        VStack(spacing: 6) {
          ForEach(0..<3, id: \.self) { _ in
            ProjectSkeletonRow()
          }
        }
      } else if !hasProjects && !hasSnacks && !isLoadingData {
        // Demo project card
        Button {
          startDemoProject()
        } label: {
          HStack(spacing: 12) {
            Image(systemName: "sparkles")
              .font(.system(size: 14))
              .foregroundColor(.white)
              .frame(width: 28, height: 28)
              .background(Color.blue, in: RoundedRectangle(cornerRadius: 6))

            VStack(alignment: .leading, spacing: 2) {
              HStack(spacing: 6) {
                Text("Learning Playground")
                  .font(.body)
                  .fontWeight(.semibold)
                  .foregroundColor(.primary)

                Text("Example")
                  .font(.caption2)
                  .fontWeight(.medium)
                  .foregroundColor(.secondary)
                  .padding(.horizontal, 6)
                  .padding(.vertical, 2)
                  .background(Color.secondary.opacity(0.15), in: RoundedRectangle(cornerRadius: 4))
              }

              Text("Learn to code on mobile")
                .font(.caption)
                .foregroundColor(.secondary)
            }

            Spacer()

            if isLoadingDemoProject {
              ProgressView()
            } else {
              Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
            }
          }
          .padding()
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
        }
        .buttonStyle(.plain)
        .disabled(viewModel.isLoadingApp)

        EmptyStateView(
          icon: "folder",
          message: "No projects yet",
          description: "Try out the playground example"
        )
      } else {
        VStack(spacing: 6) {
          // Projects
          ForEach(viewModel.projects.prefix(3)) { project in
            ProjectRowWithNavigation(
              project: project,
              shouldNavigateToDetails: false,
              isLoading: loadingProjectId == project.id,
              onLoadingChange: { loadingProjectId = $0 ? project.id : nil }
            )
            .disabled(viewModel.isLoadingApp)
          }

          if viewModel.totalProjectCount > 3 {
            NavigationLink(destination: ProjectsListView(accountName: viewModel.selectedAccount?.name ?? "")) {
              Text("See all")
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.expoSecondarySystemBackground)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
                .contentShape(Rectangle())
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
            SnackRowWithAction(
              snack: snack,
              isLoading: loadingSnackId == snack.id,
              onLoadingChange: { loadingSnackId = $0 ? snack.id : nil }
            )
            .disabled(viewModel.isLoadingApp)
          }

          if viewModel.snacks.count > 3 {
            NavigationLink(destination: SnacksListView(accountName: viewModel.selectedAccount?.name ?? "")) {
              Text("See all")
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.expoSecondarySystemBackground)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
                .contentShape(Rectangle())
            }
          }
        }
      }
    }
    .onChange(of: viewModel.isLoadingApp) { isLoading in
      if !isLoading {
        loadingProjectId = nil
        loadingSnackId = nil
        isLoadingDemoProject = false
      }
    }
  }

  private func startDemoProject() {
    isLoadingDemoProject = true

    let service = PlaygroundService.shared
    let channel = service.generateChannelId()

    let url = service.buildRuntimeUrl(
      channel: channel,
      sdkVersion: Versions.sharedInstance.sdkVersion
    )

    // Convert DemoProject files to the format expected by openApp
    var codeDict: [String: [String: Any]] = [:]
    for (path, file) in DemoProject.snackFiles {
      codeDict[path] = [
        "contents": file.contents,
        "type": file.isAsset ? "ASSET" : "CODE"
      ]
    }

    let snackParams: NSDictionary = [
      "channel": channel,
      "snackId": DemoProject.displayName,
      "code": codeDict,
      "dependencies": DemoProject.snackDependencies,
      "lessonDescription": "Learn to code on mobile"
    ]

    viewModel.openApp(url: url, snackParams: snackParams)
  }
}

struct ProjectsSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var loadingProjectId: String?

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "PROJECTS")

      VStack(spacing: 6) {
        ForEach(viewModel.projects.prefix(3)) { project in
          ProjectRowWithNavigation(
            project: project,
            shouldNavigateToDetails: false,
            isLoading: loadingProjectId == project.id,
            onLoadingChange: { loadingProjectId = $0 ? project.id : nil }
          )
          .disabled(viewModel.isLoadingApp)
        }

        if viewModel.totalProjectCount > 3 {
          NavigationLink(destination: ProjectsListView(accountName: viewModel.selectedAccount?.name ?? "")) {
            Text("See all")
              .frame(maxWidth: .infinity)
              .padding()
              .background(Color.expoSecondarySystemBackground)
              .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
              .contentShape(Rectangle())
          }
        }
      }
    }
    .onChange(of: viewModel.isLoadingApp) { isLoading in
      if !isLoading {
        loadingProjectId = nil
      }
    }
  }
}

struct ProjectRowWithNavigation: View {
  let project: ExpoProject
  let shouldNavigateToDetails: Bool
  var isLoading: Bool = false
  var onLoadingChange: ((Bool) -> Void)?
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var shouldNavigate = false

  var body: some View {
    if shouldNavigateToDetails {
      NavigationLink(
        destination: ProjectDetailsView(projectId: project.id, initialProject: project),
        isActive: $shouldNavigate
      ) {
        ProjectRow(project: project, isLoading: isLoading) {
          handleProjectTap()
        }
      }
    } else {
      ProjectRow(project: project, isLoading: isLoading) {
        handleProjectTap()
      }
    }
  }

  private var hasUpdates: Bool {
    project.firstTwoBranches.contains { !$0.updates.isEmpty }
  }

  private func handleProjectTap() {
    // If no updates available, navigate to details view
    guard hasUpdates else {
      if shouldNavigateToDetails {
        shouldNavigate = true
      }
      return
    }

    if shouldNavigateToDetails {
      if project.firstTwoBranches.count == 1 {
        let branch = project.firstTwoBranches[0]
        if branch.updates.count == 1 {
          let update = branch.updates[0]
          if isSDKCompatible(update.expoGoSDKVersion) {
            onLoadingChange?(true)
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
        onLoadingChange?(true)
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
