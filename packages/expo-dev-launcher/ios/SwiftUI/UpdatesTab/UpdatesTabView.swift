// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct UpdatesTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel

  var body: some View {
    ScrollView {
      Group {
        if !viewModel.isLoggedIn {
          NotSignedInView()
            .padding()
        } else if !viewModel.structuredBuildInfo.usesEASUpdates {
          NotUsingUpdatesView()
            .padding()
        } else {
          UpdatesListView()
        }
      }
      .maxContentWidth()
    }
    #if os(tvOS)
    .background()
    #endif
    .devLauncherToolbar()
  }
}
