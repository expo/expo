// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

enum DevLauncherTab {
  case home
  case updates
  case settings

  var title: String {
    switch self {
    case .home: return "Home"
    case .updates: return "Updates"
    case .settings: return "Settings"
    }
  }

  var systemImage: String {
    switch self {
    case .home: return "house.fill"
    case .updates: return "arrow.2.circlepath"
    case .settings: return "gearshape"
    }
  }
}

struct TabNavigation<Content: View>: View {
  let tab: DevLauncherTab
  let title: String?
  let content: Content

  init(_ tab: DevLauncherTab, title: String? = nil, @ViewBuilder content: () -> Content) {
    self.tab = tab
    self.title = title
    self.content = content()
  }

  var body: some View {
    NavigationStack {
      content
        .navigationTitle(title ?? tab.title)
#if os(iOS)
        .navigationBarTitleDisplayMode(.large)
#endif
    }
    .tabItem {
      Label(tab.title, systemImage: tab.systemImage)
    }
  }
}
