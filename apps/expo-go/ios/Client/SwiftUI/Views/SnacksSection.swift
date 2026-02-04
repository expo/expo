//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import EXDevMenu

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

    // Generate channel for this session
    let channel = generateChannelId()
    let snackId = snack.fullName

    // Set up the editing session in the background
    // This connects to Snackpub and prepares to respond to the snack runtime's RESEND_CODE
    Task {
      await SnackEditingSession.shared.setupSession(
        snackId: snackId,
        channel: channel,
        isStaging: false,
        name: snack.name
      )
    }

    // Open the snack with the channel
    let url = createSnackRuntimeUrl(sdkVersion: versions.sdkVersion, snack: snackId, channel: channel)

    viewModel.openApp(url: url)
    // TODO: Re-enable once we properly handle snack sessions when reopening
    // viewModel.addToRecentlyOpened(url: url, name: snack.name, iconUrl: nil)
  }

  /// Creates a Snack runtime URL matching the format from snack-content package
  private func createSnackRuntimeUrl(sdkVersion: String, snack: String, channel: String) -> String {
    var components = URLComponents()
    components.scheme = "exp"
    components.host = "u.expo.dev"
    components.path = "/933fd9c0-1666-11e7-afca-d980795c5824"

    components.queryItems = [
      URLQueryItem(name: "runtime-version", value: "exposdk:\(sdkVersion)"),
      URLQueryItem(name: "channel-name", value: "production"),
      URLQueryItem(name: "snack", value: snack),
      URLQueryItem(name: "snack-channel", value: channel)
    ]
    return components.url?.absoluteString ?? ""
  }

  /// Generates a random channel ID for Snackpub connection
  private func generateChannelId() -> String {
    let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return String((0..<10).map { _ in chars.randomElement()! })
  }
}
