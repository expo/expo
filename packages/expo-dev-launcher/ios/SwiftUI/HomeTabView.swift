// Copyright 2015-present 650 Industries. All rights reserved.
// swiftlint:disable closure_body_length

import SwiftUI
import ExpoModulesCore

struct HomeTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var showingInfoDialog = false

  var body: some View {
    ScrollView {
      VStack(spacing: 20) {
        DevelopmentBuildCaption()

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
                .foregroundStyle(Color.primary.opacity(0.6))
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
      .maxContentWidth()
    }
    #if !os(tvOS)
    .refreshable {
      await viewModel.refreshDevServers()
    }
    #endif
    #if os(tvOS)
    .background()
    #endif
    .devLauncherToolbar()
    .toolbar {
      if let appIcon = viewModel.appIcon {
        ToolbarItem(placement: .navigation) {
          AppIconImage(image: appIcon)
        }
        .sharedBackgroundHidden()
      }
    }
    .modifier(DevelopmentBuildSubtitle())
    .onAppear {
      viewModel.loadRecentlyOpenedApps()
    }
    .sheet(isPresented: $showingInfoDialog) {
      DevServerInfoModal()
    }
  }

  private var crashReportBanner: some View {
    Button {
      viewModel.showCrashReport()
    }
    label: {
      Text("The last time you tried to open an app the development build crashed. Tap to get more information.")
        .font(.body)
        .foregroundStyle(Color.primary)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }
    .buttonStyle(PlainButtonStyle())
    .background(Color.expoSecondarySystemGroupedBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18))
  }
}

private struct AppIconImage: View {
  let image: UIImage

  var body: some View {
    Image(uiImage: image)
      .resizable()
      .scaledToFit()
      .frame(width: 28, height: 28)
      .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
      .accessibilityHidden(true)
  }
}

private struct DevelopmentBuildSubtitle: ViewModifier {
  func body(content: Content) -> some View {
#if os(iOS)
    if #available(iOS 26.0, *) {
      content.navigationSubtitle("Development Build")
    } else {
      content
    }
#elseif os(macOS)
    content.navigationSubtitle("Development Build")
#else
    content
#endif
  }
}

private struct DevelopmentBuildCaption: View {
  var body: some View {
    if showsCaption {
      Text("Development Build")
        .font(.subheadline)
        .foregroundStyle(Color.secondary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
  }

  private var showsCaption: Bool {
#if os(iOS)
    if #available(iOS 26.0, *) {
      return false
    }
    return true
#elseif os(tvOS)
    return true
#else
    return false
#endif
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
          .foregroundStyle(Color.orange)
        VStack(alignment: .leading, spacing: 4) {
          Text("Local Network Access Disabled")
            .font(.subheadline)
            .fontWeight(.semibold)
            .foregroundStyle(Color.primary)
          Text("Dev servers can't be discovered. Tap to open Settings and enable Local Network access.")
            .font(.footnote)
            .foregroundStyle(Color.secondary)
            .multilineTextAlignment(.leading)
        }
        Spacer()
        Image(systemName: "gear")
          .foregroundStyle(Color.secondary)
      }
      .padding()
    }
    .buttonStyle(PlainButtonStyle())
    .background(Color.expoSecondarySystemGroupedBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18))
  }
}
// swiftlint:enable closure_body_length
