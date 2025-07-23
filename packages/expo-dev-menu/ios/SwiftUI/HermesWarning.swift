import SwiftUI

struct HermesWarning: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Image(systemName: "exclamationmark.triangle.fill")
          .foregroundColor(.orange)

        Text("Warning")
          .font(.headline)
          .foregroundColor(.orange)

        Spacer()
      }

      Text("Debugging not working? Try manually reloading first")
        .font(.caption)
        .foregroundColor(.orange)
    }
    .padding()
    .background(Color.orange.opacity(0.1))
    .overlay(
      RoundedRectangle(cornerRadius: 12)
        .stroke(Color.orange, lineWidth: 1)
    )
    .cornerRadius(12)
    .padding(.horizontal)
    .padding(.vertical, 8)
  }
}

#Preview {
  HermesWarning()
}
