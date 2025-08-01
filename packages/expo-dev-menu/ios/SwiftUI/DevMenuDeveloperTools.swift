import SwiftUI

struct DevMenuDeveloperTools: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    VStack(spacing: 0) {
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
    #if !os(tvOS)
    .background(Color(.systemBackground))
    #endif
    .cornerRadius(12)
    .padding(.horizontal)
    .padding(.vertical, 8)
  }
}

#Preview {
  DevMenuDeveloperTools()
}
