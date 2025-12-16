import SwiftUI

// swiftlint:disable closure_body_length

struct DevMenuDeveloperTools: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  private var shouldShowEcho: Bool {
    guard let hostUrl = viewModel.appInfo?.hostUrl,
          let url = URL(string: hostUrl),
          let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let queryItems = components.queryItems else {
      return false
    }
    return queryItems.first(where: { $0.name == "project-type" })?.value == "echo"
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("TOOLS")
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        if shouldShowEcho {
          DevMenuActionButton(
            title: "Switch to AI",
            icon: "sparkles",
            action: {
              viewModel.showAIMode = true
            }
          )

          Divider()
        }

        DevMenuActionButton(
          title: "Toggle performance monitor",
          icon: "speedometer",
          action: viewModel.togglePerformanceMonitor,
          disabled: !(viewModel.devSettings?.isPerfMonitorAvailable ?? true)
        )

        Divider()

        DevMenuActionButton(
          title: "Toggle element inspector",
          icon: "viewfinder",
          action: viewModel.toggleElementInspector,
          disabled: !(viewModel.devSettings?.isElementInspectorAvailable ?? true)
        )

        if viewModel.devSettings?.isJSInspectorAvailable == true {
          Divider()

          DevMenuActionButton(
            title: "Open JS debugger",
            icon: "ladybug",
            action: viewModel.openJSInspector
          )
        }

        Divider()

        DevMenuToggleButton(
          title: "Fast refresh",
          icon: "figure.run",
          isEnabled: viewModel.devSettings?.isHotLoadingEnabled ?? false,
          action: viewModel.toggleFastRefresh,
          disabled: !(viewModel.devSettings?.isHotLoadingAvailable ?? true)
        )
      }
      .background(Color.expoSystemBackground)
      .cornerRadius(18)
    }
  }
}

#Preview {
  DevMenuDeveloperTools()
}

// swiftlint:enable closure_body_length
