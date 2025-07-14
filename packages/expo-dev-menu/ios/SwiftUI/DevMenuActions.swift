import SwiftUI

struct DevMenuActions: View {
  let isDevLauncherInstalled: Bool
  let onReload: () -> Void
  let onGoHome: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      DevMenuActionButton(
        title: "Reload",
        icon: "arrow.clockwise",
        action: onReload
      )

      if isDevLauncherInstalled {
        Divider()

        DevMenuActionButton(
          title: "Go home",
          icon: "house.fill",
          action: onGoHome
        )
      }
    }
    .background(Color(.systemBackground))
    .cornerRadius(12)
    .padding(.horizontal)
    .padding(.vertical, 8)
  }
}
