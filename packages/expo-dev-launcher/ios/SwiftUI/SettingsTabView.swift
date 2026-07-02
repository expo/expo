// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

// swiftlint:disable:next line_length
private let selectedGesturesInfoMessage = "Selected gestures will toggle the developer menu while inside a preview. The menu allows you to reload or return to home and exposes developer tools."

struct SettingsTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var showCopiedMessage = false
  @State private var defaultPageSize: Int = 10
  @State private var showCacheClearedMessage = false

  private func createBuildInfoJSON() -> String {
    let buildInfoDict: [String: Any] = [
      "runtimeVersion": viewModel.buildInfo["runtimeVersion"] as? String ?? "",
      "sdkVersion": viewModel.structuredBuildInfo.sdkVersion ?? "",
      "appName": viewModel.buildInfo["appName"] as? String ?? "",
      "appVersion": viewModel.buildInfo["appVersion"] as? String ?? "",
      "appExpirationDate": viewModel.buildInfo["appExpirationDate"] as? String ?? ""
    ]

    do {
      let jsonData = try JSONSerialization.data(withJSONObject: buildInfoDict, options: .prettyPrinted)
      return String(data: jsonData, encoding: .utf8) ?? "{}"
    } catch {
      return "{}"
    }
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 24) {
        SafeAreaTopPadding(manualInset: viewModel.topSafeAreaInset)
        titleSection
        launchBehaviour
        gestures

        Text(selectedGesturesInfoMessage)
          .font(.system(size: 13))
          .foregroundStyle(.secondary)

        #if !targetEnvironment(simulator)
        localNetworkDebugSettings
        #endif

        VStack(alignment: .leading, spacing: 8) {
          Text("system".uppercased())
            .font(.caption)
            .foregroundColor(.primary.opacity(0.6))

          VStack(spacing: 0) {
            version
            if let expiration = viewModel.buildInfo["appExpirationDate"] as? String {
              Divider()
              expirationRow(expiration)
            }
            Divider()
            copyToClipboardButton
          }
          .background(Color.expoSecondarySystemBackground)
          .cornerRadius(12)
        }

        if isAdminUser {
          debugSettings
          easUpdateConfig
        }
      }
      .padding()
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    #if os(tvOS)
    .background()
    #endif
    #if !os(macOS)
    .navigationBarHidden(true)
    #endif
    #if os(iOS) && !targetEnvironment(simulator)
    .task {
      viewModel.refreshPermissionStatus()
    }
    .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
      viewModel.refreshPermissionStatus()
    }
    #endif
  }

  private var launchBehaviour: some View {
    VStack(alignment: .leading) {
      Text("Launch behaviour".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        HStack {
          Image("show-menu-at-launch", bundle: getDevLauncherBundle())
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 24, height: 24)
            .opacity(0.6)
          Toggle("Show menu at launch", isOn: $viewModel.showOnLaunch)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)

        Divider()

        HStack {
          Image(systemName: "arrow.trianglehead.clockwise.rotate.90")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 24, height: 24)
            .opacity(0.6)
          Toggle("Auto-launch most recent app", isOn: $viewModel.autoLaunchMostRecent)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)
    }
  }

  private var titleSection: some View {
    Text("Settings")
      .font(.largeTitle)
      .fontWeight(.bold)
      .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var gestures: some View {
    VStack(alignment: .leading) {
      Text("Menu Gestures".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        HStack {
          Image("shake-device", bundle: getDevLauncherBundle())
            .resizable()
            .frame(width: 24, height: 24)
            .opacity(0.6)
          Toggle("Shake device", isOn: $viewModel.shakeDevice)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)

        Divider()

        HStack {
          Image("three-finger-long-press", bundle: getDevLauncherBundle())
            .resizable()
            .frame(width: 24, height: 24)
            .opacity(0.6)
          Toggle("Three-finger long-press", isOn: $viewModel.threeFingerLongPress)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)
    }
  }

  private var version: some View {
    HStack {
      Text("Version")
      Spacer()
      Text(viewModel.buildInfo["appVersion"] as? String ?? "")
        .foregroundColor(.secondary)
    }
    .padding(.horizontal)
    .padding(.vertical, 12)
  }

  private func expirationRow(_ text: String) -> some View {
    HStack {
      Text("Expires in")
      Spacer()
      Text(text)
        .foregroundColor(.secondary)
    }
    .padding(.horizontal)
    .padding(.vertical, 12)
  }

  private var copyToClipboardButton: some View {
#if os(tvOS)
    Text("Clipboard not available on tvOS")
      .padding(.horizontal)
      .padding(.vertical, 12)
#else
    Button {
      UIPasteboard.general.string = createBuildInfoJSON()
      showCopiedMessage = true

      DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
        showCopiedMessage = false
      }
    } label: {
      HStack {
        Text(showCopiedMessage ? "Copied to clipboard!" : "Copy system info")
        Spacer()
        Image(systemName: showCopiedMessage ? "checkmark" : "clipboard")
          .foregroundColor(.secondary)
      }
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .foregroundColor(showCopiedMessage ? .green : .primary)
    .padding(.horizontal)
    .padding(.vertical, 12)
#endif
  }

  private var isAdminUser: Bool {
    return viewModel.user?.isExpoAdmin == true
  }

  private var debugSettings: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Debug Settings".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        clearNetworkCacheRow
        Divider()
        defaultPageSizeRow
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)
    }
  }

  private var clearNetworkCacheRow: some View {
    Button {
      clearNetworkCache()
    } label: {
      HStack {
        Text(showCacheClearedMessage ? "Network cache cleared!" : "Clear network cache")
        Spacer()
        Image(systemName: showCacheClearedMessage ? "checkmark" : "trash")
          .foregroundColor(showCacheClearedMessage ? .green : .secondary)
      }
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .foregroundColor(showCacheClearedMessage ? .green : .primary)
    .padding(.horizontal)
    .padding(.vertical, 12)
  }

  private var defaultPageSizeRow: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("Default Page Size")
      Text("Sets the number of items fetched for branches and updates")
        .foregroundStyle(.secondary)
        .font(.footnote)
      Picker("", selection: $defaultPageSize) {
        Text("1").tag(1)
        Text("5").tag(5)
        Text("10").tag(10)
      }
      .pickerStyle(.segmented)
    }
    .padding(.horizontal)
    .padding(.vertical, 12)
  }

  private var easUpdateConfig: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("EAS Update Configuration".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(alignment: .leading, spacing: 8) {
        Text(createEASConfigJSON())
          .font(.system(.caption, design: .monospaced))
        #if !os(tvOS)
          .textSelection(.enabled)
        #endif
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.horizontal)
      .padding(.vertical, 12)
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)
    }
  }

  private func clearNetworkCache() {
    URLCache.shared.removeAllCachedResponses()

    showCacheClearedMessage = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
      showCacheClearedMessage = false
    }
  }

  private func createEASConfigJSON() -> String {
    let appId = viewModel.structuredBuildInfo.appId
    let runtimeVersion = viewModel.structuredBuildInfo.runtimeVersion
    let usesEASUpdates = viewModel.structuredBuildInfo.usesEASUpdates
    let projectUrl = viewModel.structuredBuildInfo.projectUrl ?? ""

    return """
    {
      "appId": "\(appId)",
      "runtimeVersion": "\(runtimeVersion)",
      "usesEASUpdates": \(usesEASUpdates),
      "projectUrl": "\(projectUrl)"
    }
    """
  }

  #if !targetEnvironment(simulator)
  private var localNetworkStatus: (text: String, icon: String, color: Color)? {
    switch viewModel.permissionStatus {
    case .granted:
      return ("Allowed", "checkmark.circle.fill", .green)
    case .denied:
      return ("Not allowed", "xmark.circle.fill", .red)
    case .checking, .unknown:
      return nil
    }
  }

  private var localNetworkDebugSettings: some View {
    VStack(alignment: .leading, spacing: 8) {
      VStack(spacing: 0) {
        localNetworkStatusRow

        if viewModel.permissionStatus == .denied {
          Divider()
          openAppSettingsRow
        }
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)
    }
  }

  private var localNetworkStatusRow: some View {
    HStack {
      Text("Local Network")
      Spacer()
      if let status = localNetworkStatus {
        Text(status.text)
          .foregroundColor(.secondary)
        Image(systemName: status.icon)
          .foregroundColor(status.color)
      } else {
        ProgressView()
      }
    }
    .padding(.horizontal)
    .padding(.vertical, 12)
  }

  @ViewBuilder
  private var openAppSettingsRow: some View {
    #if os(iOS)
    Button {
      if let url = URL(string: UIApplication.openSettingsURLString) {
        UIApplication.shared.open(url)
      }
    } label: {
      HStack {
        Text("Open App Settings")
        Spacer()
        Image(systemName: "gear")
          .foregroundColor(.secondary)
      }
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .foregroundColor(.primary)
    .padding(.horizontal)
    .padding(.vertical, 12)
    #endif
  }
  #endif
}
