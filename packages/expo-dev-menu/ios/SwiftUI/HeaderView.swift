import SwiftUI
import ExpoModulesCore

#if os(macOS)
import AppKit
typealias PlatformImage = NSImage
#else
import UIKit
typealias PlatformImage = UIImage
#endif

struct HeaderView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel
  @State private var appIcon: PlatformImage?

  var body: some View {
    HStack(spacing: 12) {
#if os(macOS)
      if let icon = appIcon {
        Image(nsImage: icon)
          .resizable()
          .scaledToFit()
          .frame(width: 38, height: 38)
          .clipShape(RoundedRectangle(cornerRadius: 16))
      }
#else
      if let icon = appIcon {
        Image(uiImage: icon)
          .resizable()
          .scaledToFit()
          .frame(width: 38, height: 38)
          .clipShape(RoundedRectangle(cornerRadius: 16))
      }
#endif

      VersionInfo(appInfo: viewModel.appInfo, showRuntimeVersion: viewModel.configuration.showRuntimeVersion)

      Spacer()

      Button {
        viewModel.hideMenu()
      } label: {
        ZStack {
          Circle()
          #if os(tvOS)
            .fill(Color.expoSystemGray4.opacity(0.2))
          #else
            .fill(Color.expoSystemGray6)
          #endif
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
#if os(macOS)
      appIcon = NSImage(contentsOfFile: url.path)
#else
      appIcon = UIImage(contentsOfFile: url.path)
#endif
    } else {
      do {
        let (data, _) = try await URLSession.shared.data(from: url)
#if os(macOS)
        if let loadedImage = NSImage(data: data) {
          appIcon = loadedImage
        }
#else
        if let loadedImage = UIImage(data: data) {
          appIcon = loadedImage
        }
#endif
      } catch {
        appIcon = nil
      }
    }
  }
}

private struct VersionInfo: View {
  let appInfo: AppInfo?
  let showRuntimeVersion: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(appInfo?.appName ?? "")
        .font(.headline)
        .fontWeight(.bold)
        .lineLimit(1)

      if showRuntimeVersion {
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
}
