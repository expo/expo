import SwiftUI

struct HermesWarning: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Image(systemName: "exclamationmark.triangle.fill")
        Text("Warning")
          .font(.headline)

        Spacer()
      }
      .foregroundColor(.orange)

      Text("Debugging not working? Try manually reloading first")
        .font(.caption)
    }
    .padding()
    .background(Color.yellow.opacity(0.2))
    .cornerRadius(18)
  }
}

#Preview {
  HermesWarning()
}
