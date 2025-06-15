// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct SettingsTabView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var showCopiedMessage = false

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
    VStack(alignment: .leading, spacing: 0) {
      Text("Settings")
        .font(.title2)
        .padding(.horizontal, 20)
      List {
        showMenuAtLaunch
        gestures

        Section {
          Text("Selected gestures will toggle the developer menu while inside a preview. The menu allows you to reload or return to home and exposes developer tools.")
            .font(.system(size: 13))
            .foregroundStyle(.secondary)
        }

        Section {
          version
          copyToClipboardButton
        }
      }
    }
    .background(Color(.systemGroupedBackground))
    .navigationBarHidden(true)
  }

  private var showMenuAtLaunch: some View {
    HStack {
      Image("show-menu-at-launch", bundle: getDevLauncherBundle())
        .resizable()
        .frame(width: 24, height: 24)
      Toggle("Show menu at launch", isOn: $viewModel.showOnLaunch)
    }
  }

  private var gestures: some View {
    Section("Menu Gestures") {
      HStack {
        Image("shake-device", bundle: getDevLauncherBundle())
          .resizable()
          .frame(width: 24, height: 24)
        Toggle("Shake Device", isOn: $viewModel.shakeDevice)
      }
      HStack {
        Image("three-finger-long-press", bundle: getDevLauncherBundle())
          .resizable()
          .frame(width: 24, height: 24)
        Toggle("Three-finger long-press", isOn: $viewModel.threeFingerLongPress)
      }
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
    Button(showCopiedMessage ? "Copied to clipboard!" : "Tap to Copy All") {
      let buildInfoJSON = createBuildInfoJSON()
      let clipboard = UIPasteboard.general
      clipboard.string = buildInfoJSON

      showCopiedMessage = true

      DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
        showCopiedMessage = false
      }
    }
  }
}

#Preview {
  SettingsTabView()
}
