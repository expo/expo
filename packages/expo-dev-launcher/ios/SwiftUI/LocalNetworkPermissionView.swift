// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct LocalNetworkPermissionView: View {
  let onContinue: () -> Void
  let width = UIScreen.main.bounds.width

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      VStack(spacing: 24) {
        Text("Finding Dev Servers")
          .font(.title)
          .fontWeight(.bold)
        
        Image("sandbox", bundle: getDevLauncherBundle())
          .resizable()
          .scaledToFit()
          .frame(width: width * 0.9)
          .clipShape(RoundedRectangle(cornerRadius: 12))
          .overlay(
            RoundedRectangle(cornerRadius: 12)
              .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
          )
        
        Text("Expo Dev Launcher needs to access your local network to discover development servers running on your computer.")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }

      Spacer()

      VStack(spacing: 12) {
        Button {
          onContinue()
        } label: {
          Text("Continue")
            .fontWeight(.semibold)
            .frame(maxWidth: .infinity)
            .padding()
        }
        .background(Color.expoSecondarySystemBackground)
        .foregroundColor(.primary)
        .cornerRadius(12)

        Text("When system prompt pops up, tap \u{201C}Allow\u{201D} to continue.")
          .font(.footnote)
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
