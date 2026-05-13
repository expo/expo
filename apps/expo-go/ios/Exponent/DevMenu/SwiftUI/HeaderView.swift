// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct HeaderView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel
  @State private var appIcon: UIImage?

  var body: some View {
    HStack(spacing: 12) {
      if let icon = appIcon {
        Image(uiImage: icon)
          .resizable()
          .scaledToFit()
          .frame(width: 38, height: 38)
          .clipShape(RoundedRectangle(cornerRadius: 16))
      }

      VersionInfo(appInfo: viewModel.appInfo)

      Spacer()

      Button {
        viewModel.hideMenu()
      } label: {
        ZStack {
          Circle()
            .fill(Color.expoSystemGray6)
            .frame(width: 36, height: 36)

          Image(systemName: "xmark")
            .font(.headline)
            .tint(.gray.opacity(0.6))
        }
      }
    }
    .onChange(of: viewModel.appInfo?.appIcon) { newIconPath in
      Task {
        await loadIcon(from: newIconPath)
      }
    }
    .task {
      await loadIcon(from: viewModel.appInfo?.appIcon)
    }
    .padding()
  }

  private func loadIcon(from path: String?) async {
    guard let path, let url = URL(string: path) else {
      appIcon = nil
      return
    }

    if url.isFileURL {
      appIcon = UIImage(contentsOfFile: url.path)
    } else {
      do {
        let (data, _) = try await URLSession.shared.data(from: url)
        if let loadedImage = UIImage(data: data) {
          appIcon = loadedImage
        }
      } catch {
        appIcon = nil
      }
    }
  }
}

private struct VersionInfo: View {
  let appInfo: AppInfo?

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(appInfo?.appName ?? "")
        .font(.headline)
        .fontWeight(.bold)
        .lineLimit(1)

      if let runtimeVersion = appInfo?.runtimeVersion {
        Text("Runtime version: \(runtimeVersion)")
          .font(.caption)
          .foregroundColor(.secondary)
      }

      if let sdkVersion = appInfo?.sdkVersion {
        Text("SDK version: \(sdkVersion)")
          .font(.caption)
          .foregroundColor(.secondary)
      }
    }
  }
}
