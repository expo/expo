// Copyright 2015-present 650 Industries. All rights reserved.
// swiftlint:disable closure_body_length

import SwiftUI

struct HomeTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var showingInfoDialog = false

  var body: some View {
    VStack(spacing: 0) {
      DevLauncherNavigationHeader()

      ScrollView {
        VStack(spacing: 20) {
          if viewModel.hasStoredCrash {
            crashReportBanner
          }

          #if !targetEnvironment(simulator)
          if viewModel.permissionStatus == .denied {
            NetworkPermissionsBanner()
          }
          #endif

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

struct NetworkPermissionsBanner: View {
  var body: some View {
    Button {
#if os(iOS)
      if let url = URL(string: UIApplication.openSettingsURLString) {
        UIApplication.shared.open(url)
      }
#endif
    } label: {
      HStack {
        Image(systemName: "wifi.exclamationmark")
          .font(.title2)
          .foregroundColor(.orange)
        VStack(alignment: .leading, spacing: 4) {
          Text("Local Network Access Disabled")
            .font(.subheadline)
            .fontWeight(.semibold)
            .foregroundColor(.primary)
          Text("Dev servers can't be discovered. Tap to open Settings and enable Local Network access.")
            .font(.footnote)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.leading)
        }
        Spacer()
        Image(systemName: "gear")
          .foregroundColor(.secondary)
      }
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
