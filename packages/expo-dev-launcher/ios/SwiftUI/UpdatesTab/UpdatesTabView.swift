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

  var body: some View {
    VStack(spacing: 0) {
      DevLauncherNavigationHeader()

      if !viewModel.isLoggedIn {
        NotSignedInView()
      } else if !viewModel.structuredBuildInfo.usesEASUpdates {
        NotUsingUpdatesView()
      } else {
        UpdatesListView()
      }
    }
    .background(Color(.systemGroupedBackground))
  }
}

#Preview {
  UpdatesTabView()
}
