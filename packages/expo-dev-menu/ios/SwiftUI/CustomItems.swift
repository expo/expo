import SwiftUI

struct CustomItems: View {
  let callbacks: [String]
  let onFireCallback: (String) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("Custom Menu Items")
          .font(.headline)
          .foregroundColor(.primary)
        Spacer()
      }
      .padding(.horizontal)

      VStack(spacing: 0) {
        ForEach(Array(callbacks.enumerated()), id: \.offset) { index, name in
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
          .background(Color(.systemBackground))

          if index < callbacks.count - 1 {
            Divider()
          }
        }
      }
      .cornerRadius(12)
      .padding(.horizontal)
    }
    .padding(.vertical, 8)
  }
}
