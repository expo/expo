// Copyright 2015-present 650 Industries. All rights reserved.
// swiftlint:disable closure_body_length

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
          if viewModel.hasStoredCrash {
            crashReportBanner
          }

          DevServersView(showingInfoDialog: $showingInfoDialog)

          if !viewModel.recentlyOpenedApps.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
              HStack {
                Text("recently opened".uppercased())
                  .font(.caption)
                  .foregroundColor(.primary.opacity(0.6))
                Spacer()
                Button("reset".uppercased()) {
                  viewModel.clearRecentlyOpenedApps()
                }
                #if os(tvOS)
                .font(.system(size: 24))
                #else
                .font(.system(size: 12))
                #endif
              }

              LazyVStack(spacing: 6) {
                ForEach(viewModel.recentlyOpenedApps) { app in
                  RecentlyOpenedAppRow(app: app) {
                    viewModel.openApp(url: app.url)
                  }
                }
              }
              .padding(.top)
            }
          }
        }
        .padding()
      }
    }
    #if os(tvOS)
    .background()
    #endif
    .overlay(
      DevServerInfoModal(showingInfoDialog: $showingInfoDialog)
    )
  }

  private var crashReportBanner: some View {
    Button {
      viewModel.showCrashReport()
    }
    label: {
      Text("The last time you tried to open an app the development build crashed. Tap to get more information.")
        .font(.body)
        .foregroundColor(.primary)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }
    .buttonStyle(PlainButtonStyle())
    .background(Color.expoSecondarySystemGroupedBackground)
    .cornerRadius(18)
  }
}

#Preview {
  HomeTabView()
}
// swiftlint:enable closure_body_length
