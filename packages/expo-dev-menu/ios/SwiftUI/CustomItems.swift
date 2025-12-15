import SwiftUI

struct CustomItems: View {
  let callbacks: [String]
  let onFireCallback: (String) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Custom Menu Items".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 6) {
        ForEach(Array(callbacks.enumerated()), id: \.offset) { _, name in
          Button {
            onFireCallback(name)
          }
          label: {
            Text(name)
              .foregroundColor(.primary)
              .frame(maxWidth: .infinity, alignment: .leading)
          }
          .padding()
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))
        }
      }
    }
  }
}
