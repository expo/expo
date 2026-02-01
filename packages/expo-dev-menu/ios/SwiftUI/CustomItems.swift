import SwiftUI

struct CustomItems: View {
  let callbacks: [DevMenuManager.Callback]
  let onFireCallback: (String) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Custom Menu Items".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 6) {
        ForEach(callbacks, id: \.name) { callback in
          if callback.type == "toggle" {
            DevMenuToggleButton(
              title: callback.name,
              icon: "switch.2",
              isEnabled: callback.value,
              action: { onFireCallback(callback.name) }
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
          } else {
            Button {
              onFireCallback(callback.name)
            }
            label: {
              Text(callback.name)
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
}
