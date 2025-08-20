import SwiftUI

struct DevMenuActions: View {
  let isDevLauncherInstalled: Bool
  let onReload: () -> Void
  let onGoHome: () -> Void

  var body: some View {
    HStack {
      DevMenuActionButton(
        title: "Reload",
        icon: "arrow.clockwise",
        action: onReload
      )
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(18)

      if isDevLauncherInstalled {
        DevMenuActionButton(
          title: "Go home",
          icon: "house.fill",
          action: onGoHome
        )
        .background(Color.expoSecondarySystemBackground)
        .cornerRadius(18)
      }
    }
  }
}
