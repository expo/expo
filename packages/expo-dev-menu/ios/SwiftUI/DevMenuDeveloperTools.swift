import SwiftUI

// swiftlint:disable closure_body_length

struct DevMenuDeveloperTools: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("TOOLS")
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        #if !os(tvOS)
        NavigationLink(destination: SourceMapExplorerView()) {
          HStack {
            Image(systemName: "map")
              .frame(width: 24, height: 24)
              .foregroundColor(.primary)
              .opacity(0.6)

            Text("Source code explorer")
              .foregroundColor(.primary)

            Spacer()

            Image(systemName: "chevron.right")
              .font(.caption)
              .foregroundColor(.secondary)
          }
          .padding()
          .background(Color.expoSecondarySystemBackground)
        }
        .buttonStyle(.plain)

        #if !os(macOS)
        // Only show divider if there are more items below
        if !viewModel.shouldHideFABToggle || viewModel.hasActiveSnackSession {
          Divider()
        }
        #endif
        #endif

        #if !os(tvOS) && !os(macOS)
        // Show reset button for any snack session (lessons or saved snacks)
        if viewModel.hasActiveSnackSession {
          DevMenuActionButton(
            title: "Undo all changes",
            icon: "arrow.counterclockwise",
            action: viewModel.resetCode,
            disabled: !viewModel.hasBeenEdited
          )
        }
        #endif

        if viewModel.configuration.showPerformanceMonitor {
          Divider()

          DevMenuActionButton(
            title: "Toggle performance monitor",
            icon: "speedometer",
            action: viewModel.togglePerformanceMonitor,
            disabled: !(viewModel.devSettings?.isPerfMonitorAvailable ?? true)
          )
        }

        if viewModel.configuration.showElementInspector {
          Divider()

          DevMenuActionButton(
            title: "Toggle element inspector",
            icon: "viewfinder",
            action: viewModel.toggleElementInspector,
            disabled: !(viewModel.devSettings?.isElementInspectorAvailable ?? true)
          )
        }

        if viewModel.devSettings?.isJSInspectorAvailable == true {
          Divider()

          DevMenuActionButton(
            title: "Open JS debugger",
            icon: "ladybug",
            action: viewModel.openJSInspector
          )
        }

        if viewModel.configuration.showFastRefresh {
          Divider()

          DevMenuToggleButton(
            title: "Fast refresh",
            icon: "figure.run",
            isEnabled: viewModel.devSettings?.isHotLoadingEnabled ?? false,
            action: viewModel.toggleFastRefresh,
            disabled: !(viewModel.devSettings?.isHotLoadingAvailable ?? true)
          )
        }

        #if !os(tvOS) && !os(macOS)
        // Hide the FAB toggle for lessons and snacks with "lesson" or "learn" in name
        if !viewModel.shouldHideFABToggle {
          DevMenuToggleButton(
            title: "Tools button",
            icon: "hand.tap",
            isEnabled: viewModel.showFloatingActionButton,
            action: viewModel.toggleFloatingActionButton
          )
        }
        #endif
      }
      .background(Color.expoSecondarySystemBackground, in: RoundedRectangle(cornerRadius: 18))
    }
  }
}

#Preview {
  DevMenuDeveloperTools()
}

// swiftlint:enable closure_body_length
