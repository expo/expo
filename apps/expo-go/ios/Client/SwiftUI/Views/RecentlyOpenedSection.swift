//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct RecentlyOpenedSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var loadingAppUrl: String?

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Text("recently opened".uppercased())
          .font(.caption)
          .foregroundColor(.primary.opacity(0.6))
        Spacer()
        Button("clear".uppercased()) {
          viewModel.clearRecentlyOpenedApps()
        }
        .font(.system(size: 12))
      }

      LazyVStack(spacing: 6) {
        ForEach(viewModel.recentlyOpenedApps) { app in
          RecentlyOpenedAppRow(app: app, isLoading: loadingAppUrl == app.url) {
            loadingAppUrl = app.url
            viewModel.openApp(url: app.url)
          }
          .disabled(viewModel.isLoadingApp)
        }
      }
      .padding(.top)
    }
    .onChange(of: viewModel.isLoadingApp) { isLoading in
      if !isLoading {
        loadingAppUrl = nil
      }
    }
  }
}
