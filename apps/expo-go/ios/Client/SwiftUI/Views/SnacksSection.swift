//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SnacksSection: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "snacks".uppercased())

      VStack(spacing: 6) {
        ForEach(viewModel.snacks.prefix(3)) { snack in
          SnackRowWithAction(snack: snack)
        }

        if viewModel.snacks.count > 3 {
          NavigationLink(destination: SnacksListView(accountName: viewModel.selectedAccount?.name ?? "")) {
            Text("See all snacks")
              .frame(maxWidth: .infinity)
              .padding()
              .background(Color.expoSecondarySystemGroupedBackground)
              .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
          }
        }
      }
    }
  }
}

struct SnackRowWithAction: View {
  let snack: Snack
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    SnackRow(snack: snack) {
      openSnack()
    }
  }

  private func openSnack() {
    let versions = Versions.sharedInstance

    guard versions.isCompatible(sdkVersion: snack.sdkVersion) else {
      let snackSDKMajor = Versions.majorVersion(from: snack.sdkVersion)
      viewModel.showError(
        "Selected Snack uses unsupported SDK (\(snackSDKMajor))\n\n" +
        "The currently running version of Expo Go supports SDK \(versions.majorVersion) only. " +
        "Update your Snack to this version to run it."
      )
      return
    }

    let encodedFullName = snack.fullName.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? snack.fullName
    let url = "exp://exp.host/\(encodedFullName)?sdkVersion=\(versions.sdkVersion).0.0"

    viewModel.openApp(url: url)
    viewModel.addToRecentlyOpened(url: url, name: snack.name, iconUrl: nil)
  }
}
