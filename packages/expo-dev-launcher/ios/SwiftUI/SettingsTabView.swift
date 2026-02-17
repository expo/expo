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
  @State private var permissionCheckResult: String = "Not checked"
  @State private var isCheckingPermission = false

  private func createBuildInfoJSON() -> String {
    let buildInfoDict: [String: Any] = [
      "runtimeVersion": viewModel.buildInfo["runtimeVersion"] as? String ?? "",
      "sdkVersion": viewModel.structuredBuildInfo.sdkVersion ?? "",
      "appName": viewModel.buildInfo["appName"] as? String ?? "",
      "appVersion": viewModel.buildInfo["appVersion"] as? String ?? ""
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
        titleSection
        showMenuAtLaunch
        gestures

        Text(selectedGesturesInfoMessage)
          .font(.system(size: 13))
          .foregroundStyle(.secondary)

        VStack(alignment: .leading, spacing: 8) {
          Text("system".uppercased())
            .font(.caption)
            .foregroundColor(.primary.opacity(0.6))
          Divider()
          version
          Divider()
          copyToClipboardButton
        }

        #if DEBUG
        localNetworkDebugSettings
        #endif

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
    #if DEBUG
    .onChange(of: viewModel.permissionStatus) { _ in
      if isCheckingPermission {
        updatePermissionResultFromStatus()
      }
    }
    #endif
  }

  private var showMenuAtLaunch: some View {
    HStack {
      Image("show-menu-at-launch", bundle: getDevLauncherBundle())
        .resizable()
        .frame(width: 24, height: 24)
        .opacity(0.6)
      Toggle("Show menu at launch", isOn: $viewModel.showOnLaunch)
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .cornerRadius(12)
  }

  private var titleSection: some View {
    HStack {
      Spacer()
      VStack {
        Image(systemName: "gearshape")
          .resizable()
          .frame(width: 56, height: 56)
          .opacity(0.3)

        Text("Settings")
          .font(.title2)
          .padding(.horizontal, 20)
      }
      Spacer()
    }
  }

  private var gestures: some View {
    VStack(alignment: .leading) {
      Text("Menu Gestures".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack {
        HStack {
          Image("shake-device", bundle: getDevLauncherBundle())
            .resizable()
            .frame(width: 24, height: 24)
            .opacity(0.6)
          Toggle("Shake Device", isOn: $viewModel.shakeDevice)
        }
        .padding()

        Divider()

        HStack {
          Image("three-finger-long-press", bundle: getDevLauncherBundle())
            .resizable()
            .frame(width: 24, height: 24)
            .opacity(0.6)
          Toggle("Three-finger long-press", isOn: $viewModel.threeFingerLongPress)
        }
        .padding()
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)
    }
  }

  private var version: some View {
    HStack {
      Text("Version")
      Spacer()
      Text(viewModel.buildInfo["runtimeVersion"] as? String ?? "")
        .foregroundColor(.secondary)
    }
  }

  private var copyToClipboardButton: some View {
    HStack {
#if os(tvOS)
      Button("Clipboard not available on tvOS") {}
#else
      Button(showCopiedMessage ? "Copied to clipboard!" : "Copy system info") {
        let buildInfoJSON = createBuildInfoJSON()
        let clipboard = UIPasteboard.general
        clipboard.string = buildInfoJSON
        showCopiedMessage = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
          showCopiedMessage = false
        }
      }
      Spacer()
      Image(systemName: "clipboard")
        .resizable()
        .scaledToFit()
        .frame(width: 16, height: 16)
        .foregroundColor(.blue)
#endif
    }
  }

  private var isAdminUser: Bool {
    return viewModel.user?.isExpoAdmin == true
  }

  private var debugSettings: some View {
    Section("Debug Settings") {
      Button(showCacheClearedMessage ? "Network cache cleared!" : "Clear network cache") {
        clearNetworkCache()
      }
      .foregroundColor(showCacheClearedMessage ? .green : nil)

      VStack(alignment: .leading) {
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
    }
  }

  private var easUpdateConfig: some View {
    Section("EAS Update Configuration") {
      VStack(alignment: .leading, spacing: 8) {
        Text(createEASConfigJSON())
          .font(.system(.caption, design: .monospaced))
        #if !os(tvOS)
          .textSelection(.enabled)
        #endif
          .padding(.vertical, 4)
      }
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

  #if DEBUG
  private var localNetworkDebugSettings: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Local Network Permission".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        HStack {
          Text("Permission Status")
          Spacer()
          Text(permissionCheckResult)
            .foregroundColor(.secondary)
        }
        .padding()

        Divider()

        HStack {
          Text("First Launch Check")
          Spacer()
          Text(viewModel.hasGrantedNetworkPermission ? "Granted" : "Pending")
            .foregroundColor(.secondary)
        }
        .padding()

        Divider()

        Button {
          checkNetworkPermission()
        } label: {
          HStack {
            if isCheckingPermission {
              ProgressView()
                .scaleEffect(0.8)
            }
            Text(isCheckingPermission ? "Checking..." : "Check Permission Now")
            Spacer()
            Image(systemName: "wifi")
              .foregroundColor(.blue)
          }
        }
        .disabled(isCheckingPermission)
        .padding()

        Divider()

        Button {
          resetPermissionFlow()
        } label: {
          HStack {
            Text("Reset Permission Flow")
            Spacer()
            Image(systemName: "arrow.counterclockwise")
              .foregroundColor(.orange)
          }
        }
        .padding()

        Divider()

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
              .foregroundColor(.blue)
          }
        }
        .padding()
        #endif
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)

      Text("Use these tools to debug local network permission flow. 'Reset Permission Flow' will show the pre-flight screen again on next launch.")
        .font(.system(size: 13))
        .foregroundStyle(.secondary)
    }
  }

  private func checkNetworkPermission() {
    isCheckingPermission = true
    permissionCheckResult = "Checking..."
    viewModel.stopServerDiscovery()
    viewModel.startServerDiscovery()
  }

  private func updatePermissionResultFromStatus() {
    isCheckingPermission = false
    if viewModel.hasGrantedNetworkPermission {
      permissionCheckResult = "✅ Granted"
    } else if viewModel.permissionStatus == .denied {
      permissionCheckResult = "❌ Denied"
    } else {
      permissionCheckResult = "⚠️ Unknown"
    }
  }

  private func resetPermissionFlow() {
    viewModel.resetPermissionFlowState()
    permissionCheckResult = "Not checked"
  }
  #endif
}

#Preview {
  SettingsTabView()
    .environmentObject(DevLauncherViewModel())
}
