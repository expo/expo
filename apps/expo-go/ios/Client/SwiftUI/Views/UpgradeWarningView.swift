//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct UpgradeWarningView: View {
  @State private var shouldShow = false
  @State private var betaSdkVersion: String?
  @State private var hasDismissedWarning = false
  @Environment(\.colorScheme) private var colorScheme

  var body: some View {
    Group {
      if shouldShow && !hasDismissedWarning {
        let background = colorScheme == .dark
          ? Color(red: 0.22, green: 0.19, blue: 0.08)
          : Color(red: 1.0, green: 0.97, blue: 0.84)
        let border = colorScheme == .dark
          ? Color(red: 0.55, green: 0.45, blue: 0.2)
          : Color(red: 0.98, green: 0.8, blue: 0.4)
        VStack(alignment: .leading, spacing: 8) {
          HStack(alignment: .top) {
            HStack(spacing: 8) {
              Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(Color(red: 0.98, green: 0.7, blue: 0.2))
              Text("New Expo Go version coming soon!")
                .font(.system(size: 13, weight: .semibold))
            }

            Spacer()

            Button {
              withAnimation(.easeInOut(duration: 0.2)) {
                hasDismissedWarning = true
              }
            } label: {
              Image(systemName: "xmark")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.secondary)
                .frame(width: 24, height: 24)
            }
          }

          if let betaSdkVersion {
            (Text("A new version of Expo Go will be released to the store soon, and it will ")
              .font(.system(size: 13))
              .foregroundColor(.primary)
              + Text("only support SDK \(betaSdkVersion).")
              .font(.system(size: 13, weight: .semibold))
              .foregroundColor(.primary)
            )
          }

          iosMessage
        }
        .padding()
        .background(background)
        .overlay(
          RoundedRectangle(cornerRadius: BorderRadius.large)
            .stroke(border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
      }
    }
    .animation(.easeInOut(duration: 0.2), value: hasDismissedWarning)
    .task {
      await refresh()
    }
  }

  private var iosMessage: some View {
    VStack(alignment: .leading, spacing: 8) {
      (Text("In order to ensure that you can upgrade at your own pace, we recommend ")
        .font(.system(size: 13))
        .foregroundColor(.primary)
        + Text("migrating to a development build.")
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(.expoBlue)
      )
      .onTapGesture {
        if let url = URL(string: "https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build") {
          UIApplication.shared.open(url)
        }
      }
      (Text("To continue using this version of Expo Go, you can ")
        .font(.system(size: 13))
        .foregroundColor(.primary)
        + Text("disable automatic app updates")
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(.primary)
        + Text(" from the App Store settings before the new version is released.")
        .font(.system(size: 13))
        .foregroundColor(.primary)
      )
    }
  }

  private func refresh() async {
    let result = await UpgradeWarningService.shouldShowUpgradeWarning()
    await MainActor.run {
      shouldShow = result.shouldShow
      betaSdkVersion = result.betaSdkVersion
    }
  }
}

private enum UpgradeWarningService {
  static func shouldShowUpgradeWarning() async -> (shouldShow: Bool, betaSdkVersion: String?) {
    if !isDevice() {
      return (false, nil)
    }

    guard let url = URL(string: "https://api.expo.dev/v2/versions") else {
      return (false, nil)
    }

    do {
      let (data, response) = try await URLSession.shared.data(from: url)
      guard let httpResponse = response as? HTTPURLResponse,
            (200..<300).contains(httpResponse.statusCode) else {
        return (false, nil)
      }

      let decoder = JSONDecoder()
      let versions = try decoder.decode(VersionsResponse.self, from: data)
      let published = versions.sdkVersions.compactMap { key, value -> VersionInfo? in
        guard let major = extractMajor(from: key) else { return nil }
        return VersionInfo(major: major, releaseNoteUrl: value.releaseNoteUrl)
      }.sorted(by: { $0.major < $1.major })

      guard published.count >= 2 else {
        return (false, nil)
      }

      let last = published[published.count - 1]
      let penultimate = published[published.count - 2]
      let currentMajor = getSDKMajorVersion(getSupportedSDKVersion())
      let currentIsLatestPublished = currentMajor == String(penultimate.major)
      let latestIsBeta = last.releaseNoteUrl == nil

      return (currentIsLatestPublished && latestIsBeta, String(last.major))
    } catch {
      return (false, nil)
    }
  }

  private static func extractMajor(from sdkVersion: String) -> Int? {
    if #available(iOS 16, *) {
      let pattern = /(\d+)\.0\.0/
      guard let match = sdkVersion.firstMatch(of: pattern),
            let major = Int(match.1) else {
        return nil
      }
      return major
    } else {
      let pattern = #"(\d+)\.0\.0"#
      guard let regex = try? NSRegularExpression(pattern: pattern),
            let match = regex.firstMatch(in: sdkVersion, range: NSRange(sdkVersion.startIndex..., in: sdkVersion)),
            let range = Range(match.range(at: 1), in: sdkVersion) else {
        return nil
      }
      return Int(sdkVersion[range])
    }
  }

  private static func isDevice() -> Bool {
#if targetEnvironment(simulator)
    return false
#else
    return true
#endif
  }
}

private struct VersionsResponse: Decodable {
  let sdkVersions: [String: VersionInfoResponse]
}

private struct VersionInfoResponse: Decodable {
  let releaseNoteUrl: String?
}

private struct VersionInfo {
  let major: Int
  let releaseNoteUrl: String?
}
