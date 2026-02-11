import SwiftUI

struct HermesDebuggerTip: View {
  @Environment(\.colorScheme) private var colorScheme

  private var colors: DevMenuColors {
    DevMenuColors(colorScheme: colorScheme)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Image(systemName: "lightbulb.fill")
        Text("Tip")
          .font(.headline)

        Spacer()
      }
      .foregroundColor(colors.tipBlue)

      Text("Debugging not working? Try manually reloading first.")
        .font(.caption)
    }
    .padding()
    .background(colors.tipBackground)
    .cornerRadius(18)
  }
}
