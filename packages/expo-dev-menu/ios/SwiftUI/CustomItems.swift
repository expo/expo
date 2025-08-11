import SwiftUI

struct CustomItems: View {
  let callbacks: [String]
  let onFireCallback: (String) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("Custom Menu Items".uppercased())
          .font(.caption)
          .foregroundColor(.primary.opacity(0.6))
        Spacer()
      }

      VStack(spacing: 6) {
        ForEach(Array(callbacks.enumerated()), id: \.offset) { _, name in
          Button {
            onFireCallback(name)
          }
          label: {
            HStack {
              Text(name)
                .foregroundColor(.primary)
              Spacer()
            }
            .padding()
          }
          #if !os(tvOS)
          .background(Color(.systemGroupedBackground))
          #endif
          .clipShape(RoundedRectangle(cornerRadius: 12))
        }
      }
    }
  }
}
