//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

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
              .clipShape(RoundedRectangle(cornerRadius: 12))
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
          if isUpdateCompatibleWithThisExpoGo(update) {

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

  private func isUpdateCompatibleWithThisExpoGo(_ update: AppUpdate) -> Bool {
    guard let sdkVersion = update.expoGoSDKVersion else {
      return false
    }

    let supportedSDK = getSupportedSDKVersion()
    let updateMajorVersion = getSDKMajorVersion(sdkVersion)
    let supportedMajorVersion = getSDKMajorVersion(supportedSDK)

    return updateMajorVersion == supportedMajorVersion
  }
}
