// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountMismatchSignInView: View {
  let username: String
  let viewModel: HomeViewModel
  let completion: DeviceLoginCompletion
  let onFinish: () -> Void

  var body: some View {
    DeviceAccountView(prefilledUsername: username, onSignedIn: signedIn)
      .environmentObject(viewModel)
      .onDisappear {
        completion.resolve(false)
      }
  }

  private func signedIn() {
    completion.resolve(true)
    onFinish()
  }
}
