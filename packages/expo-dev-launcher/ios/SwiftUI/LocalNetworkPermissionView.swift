// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct LocalNetworkPermissionView: View {
  let onContinue: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      VStack(spacing: 24) {
        Image(systemName: "wifi")
          .font(.system(size: 64))
          .foregroundColor(.accentColor)

        VStack(spacing: 12) {
          Text("Find Dev Servers")
            .font(.title)
            .fontWeight(.bold)

          Text("Expo Dev Launcher needs to access your local network to discover development servers running on your computer.")
            .font(.body)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.center)
        }

        HStack(alignment: .center, spacing: 8) {
          Image(systemName: "info.circle")
          Text("You'll see a system prompt asking for local network access.\nTap \"Allow\" to continue.")
            .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.expoSecondarySystemBackground)
        .cornerRadius(12)
        .font(.callout)
        .foregroundColor(.secondary)

        Button {
          onContinue()
        } label: {
          Text("Continue")
            .fontWeight(.semibold)
            .frame(maxWidth: .infinity)
            .padding()
        }
        .background(Color.accentColor)
        .foregroundColor(.white)
        .cornerRadius(12)
      }

      Spacer()

      VStack(spacing: 4) {
        Text("Why is this needed?")
          .font(.footnote)
          .fontWeight(.medium)
        Text("Dev servers advertise themselves on your local network using Bonjour. This permission allows the app to discover them automatically.")
          .font(.caption)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
    }
    .padding(.horizontal, 24)
    .padding(.vertical, 32)
    .background(Color.expoSystemBackground)
  }
}

#if DEBUG
struct LocalNetworkPermissionView_Previews: PreviewProvider {
  static var previews: some View {
    LocalNetworkPermissionView(onContinue: {})
  }
}
#endif
