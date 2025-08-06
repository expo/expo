// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

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
    #if !os(tvOS)
    .background(Color(.systemGroupedBackground))
    #endif
  }
}

#Preview {
  UpdatesTabView()
}
