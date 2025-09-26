// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

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
      "sdkVersion": "53.0.0",
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
    .navigationBarHidden(true)
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
}

#Preview {
  SettingsTabView()
    .environmentObject(DevLauncherViewModel())
}
