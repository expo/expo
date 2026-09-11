//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct NetworkPermissionBanner: View {
  @ObservedObject var serverService: DevelopmentServerService
  @State private var showingPermissionFlow = false

  var body: some View {
    Group {
      // `showingPermissionFlow` keeps the banner alive while its sheet is up: the grant is detected the
      // moment the system prompt appears, and hiding the banner then would tear the sheet down with it.
      if showingPermissionFlow
         || (!DevelopmentServerService.isSimulator
             && !serverService.hasGrantedNetworkPermission
             && serverService.permissionStatus != .granted) {
        Button {
          showingPermissionFlow = true
        } label: {
          HStack {
            Image(systemName: "wifi.exclamationmark")
              .font(.title2)
              .foregroundColor(.orange)
            VStack(alignment: .leading, spacing: 4) {
              Text("Local Network Access Needed")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
              Text("Projects running on your computer can't be discovered. Tap to enable access.")
                .font(.footnote)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
            }
            Spacer()
            Image(systemName: "chevron.right")
              .foregroundColor(.secondary)
          }
          .padding()
        }
        .buttonStyle(PlainButtonStyle())
        .background(Color.expoSecondarySystemBackground)
        .cornerRadius(18)
      }
    }
    .sheet(isPresented: $showingPermissionFlow) {
      LocalNetworkPermissionView(serverService: serverService) {
        serverService.startDiscovery()
        showingPermissionFlow = false
      }
    }
  }
}
