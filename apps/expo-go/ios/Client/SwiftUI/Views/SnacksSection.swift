//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SnacksSection: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "SNACKS")

      VStack(spacing: 6) {
        ForEach(viewModel.snacks.prefix(3)) { snack in
          SnackRow(snack: snack) {
            openSnack(snack)
          }
        }

        if viewModel.snacks.count > 3 {
          Button("See all snacks") {
            // TODO: Navigate to snacks list
          }
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.expoSecondarySystemGroupedBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))
        }
      }
    }
  }

  private func openSnack(_ snack: Snack) {
    let supportedSDK = getSupportedSDKVersion()
    let snackSDKMajor = getSDKMajorVersion(snack.sdkVersion)
    let supportedSDKMajor = getSDKMajorVersion(supportedSDK)

    guard snackSDKMajor == supportedSDKMajor else {
      viewModel.showErrorAlert(
        "Selected Snack uses unsupported SDK (\(snackSDKMajor))\n\n" +
        "The currently running version of Expo Go supports SDK \(supportedSDKMajor) only. " +
        "Update your Snack to this version to run it."
      )
      return
    }

    let encodedFullName = snack.fullName.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? snack.fullName
    let url = "exp://exp.host/\(encodedFullName)?sdkVersion=\(supportedSDK).0.0"

    viewModel.openApp(url: url)
    viewModel.addToRecentlyOpened(url: url, name: snack.name, iconUrl: nil)
  }

  private func getSupportedSDKVersion() -> String {
    let versions = EXVersions.sharedInstance()
    return versions.sdkVersion ?? "54"
  }

  private func getSDKMajorVersion(_ sdkVersion: String) -> String {
    return sdkVersion.components(separatedBy: ".").first ?? sdkVersion
  }
}
