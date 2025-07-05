// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct HomeTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var showingQRScanner = false
  @State private var showingInfoDialog = false

  var body: some View {
    VStack(spacing: 0) {
      DevLauncherNavigationHeader()

      ScrollView {
        VStack(spacing: 20) {
          DevServersView(showingInfoDialog: $showingInfoDialog)

          if !viewModel.recentlyOpenedApps.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
              HStack {
                Text("Recently opened")
                  .font(.headline)
                Spacer()
                Button("Reset") {
                  viewModel.clearRecentlyOpenedApps()
                }
                .font(.system(size: 12, weight: .semibold))
              }

              LazyVStack(spacing: 0) {
                ForEach(viewModel.recentlyOpenedApps) { app in
                  RecentlyOpenedAppRow(app: app) {
                    viewModel.openApp(url: app.url)
                  }
                  Divider()
                }
              }
              .clipShape(RoundedRectangle(cornerRadius: 8))
              .padding(.top)
            }
          }
        }
        .padding()
      }
    }
    .background(Color(.systemGroupedBackground))
    .overlay(
      DevServerInfoModal(showingInfoDialog: $showingInfoDialog)
    )
  }
}

#Preview {
  HomeTabView()
}
