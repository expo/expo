//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct RecentlyOpenedAppRow: View {
  let app: RecentlyOpenedApp
  let onTap: () -> Void
  @EnvironmentObject var viewModel: HomeViewModel

  private var isServerActive: Bool {
    guard let url = URL(string: app.url), let port = url.port else {
      return false
    }

    return viewModel.developmentServers.contains { server in
      guard let serverURL = URL(string: server.url),
            let serverPort = serverURL.port else {
        return false
      }
      return serverPort == port
    }
  }

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(alignment: .center) {
        Circle()
          .fill(isServerActive ? Color.green : Color.gray)
          .frame(width: 12, height: 12)
        VStack(alignment: .leading) {
          Text(app.name)
            .font(.headline)
            .foregroundColor(.primary)
          Text(app.url)
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)
        }

        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
