import SwiftUI

extension Color {
  static let tipBlue = Color(UIColor { traitCollection in
    traitCollection.userInterfaceStyle == .dark
      ? UIColor(displayP3Red: 0.49, green: 0.72, blue: 1.0, alpha: 1.0) // blue.11 dark
      : UIColor(displayP3Red: 0.15, green: 0.44, blue: 0.84, alpha: 1.0) // blue.11 light
  })

  static let tipBackground = Color(UIColor { traitCollection in
    traitCollection.userInterfaceStyle == .dark
      ? UIColor(displayP3Red: 0.078, green: 0.154, blue: 0.27, alpha: 1.0) // blue.3 dark
      : UIColor(displayP3Red: 0.912, green: 0.956, blue: 0.991, alpha: 1.0) // blue.3 light
  })
}

struct HermesDebuggerTip: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Image(systemName: "lightbulb.fill")
        Text("Tip")
          .font(.headline)

        Spacer()
      }
      .foregroundColor(Color.tipBlue)

      Text("Debugging not working? Try manually reloading first.")
        .font(.caption)
    }
    .padding()
    .background(Color.tipBackground)
    .cornerRadius(18)
  }
}

#Preview {
  HermesDebuggerTip()
}
