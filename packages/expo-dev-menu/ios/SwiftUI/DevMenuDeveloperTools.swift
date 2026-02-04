import SwiftUI

struct DevMenuDeveloperTools: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("TOOLS")
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        let items = visibleToolItems
        ForEach(Array(items.enumerated()), id: \.element) { index, item in
          toolItemView(for: item)

          // Add divider between items (not after the last one)
          if index < items.count - 1 {
            Divider()
          }
        }
      }
      .background(Color.expoSecondarySystemBackground, in: RoundedRectangle(cornerRadius: 18))
    }
  }

  // MARK: - Tool Items

  private enum ToolItem: Hashable {
    case sourceCodeExplorer
    case undoAllChanges
    case performanceMonitor
    case elementInspector
    case jsDebugger
    case fastRefresh
    case toolsButton
  }

  /// Returns the list of tool items that should be visible based on current state
  private var visibleToolItems: [ToolItem] {
    var items: [ToolItem] = []

    #if !os(tvOS)
    items.append(.sourceCodeExplorer)
    #endif

    #if !os(tvOS) && !os(macOS)
    if viewModel.hasActiveSnackSession {
      items.append(.undoAllChanges)
    }
    #endif

    if viewModel.configuration.showPerformanceMonitor {
      items.append(.performanceMonitor)
    }

    if viewModel.configuration.showElementInspector {
      items.append(.elementInspector)
    }

    if viewModel.devSettings?.isJSInspectorAvailable == true {
      items.append(.jsDebugger)
    }

    if viewModel.configuration.showFastRefresh {
      items.append(.fastRefresh)
    }

    #if !os(tvOS) && !os(macOS)
    if !viewModel.shouldHideFABToggle {
      items.append(.toolsButton)
    }
    #endif

    return items
  }

  // MARK: - Tool Item Views

  @ViewBuilder
  private func toolItemView(for item: ToolItem) -> some View {
    switch item {
    case .sourceCodeExplorer:
      sourceCodeExplorerButton

    case .undoAllChanges:
      DevMenuActionButton(
        title: "Undo all changes",
        icon: "arrow.counterclockwise",
        action: viewModel.resetCode,
        disabled: !viewModel.hasBeenEdited
      )

    case .performanceMonitor:
      DevMenuActionButton(
        title: "Toggle performance monitor",
        icon: "speedometer",
        action: viewModel.togglePerformanceMonitor,
        disabled: !(viewModel.devSettings?.isPerfMonitorAvailable ?? true)
      )

    case .elementInspector:
      DevMenuActionButton(
        title: "Toggle element inspector",
        icon: "viewfinder",
        action: viewModel.toggleElementInspector,
        disabled: !(viewModel.devSettings?.isElementInspectorAvailable ?? true)
      )

    case .jsDebugger:
      DevMenuActionButton(
        title: "Open JS debugger",
        icon: "ladybug",
        action: viewModel.openJSInspector
      )

    case .fastRefresh:
      DevMenuToggleButton(
        title: "Fast refresh",
        icon: "figure.run",
        isEnabled: viewModel.devSettings?.isHotLoadingEnabled ?? false,
        action: viewModel.toggleFastRefresh,
        disabled: !(viewModel.devSettings?.isHotLoadingAvailable ?? true)
      )

    case .toolsButton:
      DevMenuToggleButton(
        title: "Tools button",
        icon: "hand.tap",
        isEnabled: viewModel.showFloatingActionButton,
        action: viewModel.toggleFloatingActionButton
      )
    }
  }

  private var sourceCodeExplorerButton: some View {
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
  }
}

#Preview {
  DevMenuDeveloperTools()
}
